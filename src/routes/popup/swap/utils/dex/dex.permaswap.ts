import { connect } from "@permaweb/aoconnect";
import { createDataItemSigner, getTagValue } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress, getActiveKeyfile, type DecryptedWallet } from "~wallets";
import BigNumber from "bignumber.js";
import type {
  GetExpectedOutputParams,
  GetExpectedOutputResponse,
  GetLiquidityParams,
  GetLiquidityResponse,
  SwapExecutionParams,
} from "./dex.types";
import { isLocalWallet } from "~utils/assertions";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { retryWithDelay } from "~utils/promises/retry";
import { freeDecryptedWallet } from "~wallets/encryption";
import { getLinkedMessages, OrderError } from "./dex.utils";
import { queryClient } from "~utils/tanstack";

const aoInstance = connect(defaultConfig);

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult(orderID: string): Promise<[bigint, string]> {
  const messages = await getLinkedMessages(undefined, undefined, false, orderID);

  const error = messages.find((msg) => msg.tags["Action"] === "Order-Error");
  if (error) throw new OrderError(error.tags["Result"]);

  const confirmation = messages.find((msg) => msg.tags["Action"] === "Credit-Notice");
  if (!confirmation) throw new Error("Credit notice not found");

  const xffpFor = confirmation.tags["X-FFP-For"];

  const isRefund = xffpFor === "Refund";
  const isSettled = xffpFor === "Settled";

  if (isRefund) throw new OrderError("Order refunded");
  if (!isSettled) throw new Error("Order not settled");

  const tokensReceived = confirmation.tags["Quantity"];
  if (!tokensReceived) throw new OrderError("Confirmation response malformed");

  console.log("onConfirmationId", confirmation.id);

  return [BigInt(tokensReceived), confirmation.id];
}

/**
 * Fetch the result of a swap message
 */
export async function readRequestOrderResult(requestOrderId: string) {
  const messages = await getLinkedMessages(undefined, undefined, false, requestOrderId);

  const orderMadeNoticeMessage = messages.find((msg) => msg.tags["Action"] === "OrderMade-Notice");
  if (!orderMadeNoticeMessage) throw new Error("Order made notice not found");

  const orderMadeNoticeTags = orderMadeNoticeMessage.tags || {};

  const noteId = orderMadeNoticeTags["NoteID"];
  const noteSettle = orderMadeNoticeTags["NoteSettle"];

  return { noteId, noteSettle };
}

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
  swapper,
  slippage,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  swapper = swapper || (await getActiveAddress());
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [
      { name: "Action", value: "GetAmountOut" },
      { name: "TokenIn", value: tokenIn },
      { name: "AmountIn", value: amountIn },
    ],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const amountOut = getTagValue("AmountOut", tags) || "0";
  const issuerFeeQuantity = getTagValue("IssuerFee", tags) || "0";
  const poolFeeQuantity = getTagValue("PoolFee", tags) || "0";
  const holderFeeQuantity = getTagValue("HolderFee", tags) || "0";
  const inputFeeQuantity = BigNumber(issuerFeeQuantity).plus(BigNumber(poolFeeQuantity)).toFixed();
  const outputFeeQuantity = BigNumber(holderFeeQuantity).toFixed();
  const expectedMinOutput = BigNumber(amountOut)
    .multipliedBy(BigNumber(1).minus(slippage))
    .div(100)
    .toFixed(0, BigNumber.ROUND_FLOOR);
  const amountInWithoutFee = BigNumber(amountIn).minus(inputFeeQuantity).toFixed();

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    expectedMinOutput,
    amountInWithoutFee,
    totalTokenInFeeQuantity: inputFeeQuantity,
    totalTokenOutFeeQuantity: outputFeeQuantity,
    type: "permaswap",
  } satisfies GetExpectedOutputResponse;
}

export async function executeSwap({
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  poolId,
  tags = [],
}: SwapExecutionParams) {
  let decryptedWallet: DecryptedWallet;
  try {
    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);

    const requestMessageId = await aoInstance.message({
      process: poolId,
      signer,
      tags: [
        { name: "Action", value: "RequestOrder" },
        { name: "TokenIn", value: tokenIn },
        { name: "TokenOut", value: tokenOut },
        { name: "AmountIn", value: amountIn },
        { name: "AmountOut", value: minAmountOut },
      ],
    });

    const { noteId, noteSettle } = await retryWithDelay(
      () => readRequestOrderResult(requestMessageId),
      10,
      1000,
      (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    );

    if (!noteId || !noteSettle) throw new Error("Failed to create Permaswap order");

    const transferId = await aoInstance.message({
      process: tokenIn,
      signer,
      tags: [
        { name: "Action", value: "Transfer" },
        { name: "Recipient", value: noteSettle },
        { name: "Quantity", value: amountIn },
        { name: "X-FFP-For", value: "Settle" },
        { name: "X-FFP-NoteIDs", value: JSON.stringify([noteId]) },
        ...tags,
      ],
    });

    // Invalidate transfered token balance
    const activeAddress = await getActiveAddress();
    queryClient.invalidateQueries({ queryKey: ["tokenBalance", tokenIn, activeAddress] });

    return transferId;
  } catch (err) {
    log(LOG_GROUP.SWAP, "Error executing swap", err);
    throw err;
  } finally {
    // Clean up keyfile from memory
    if (decryptedWallet && decryptedWallet.type !== "hardware") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}

export async function getLiquidity({ poolId, tokenIn, tokenOut }: GetLiquidityParams): Promise<GetLiquidityResponse> {
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [{ name: "Action", value: "Info" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const isTokenInX = getTagValue("X", tags) === tokenIn;
  const reserveIn = getTagValue(isTokenInX ? "PX" : "PY", tags) || "0";
  const reserveOut = getTagValue(isTokenInX ? "PY" : "PX", tags) || "0";
  const totalSupply = getTagValue("TotalSupply", tags) || "0";

  return {
    poolId,
    tokenIn,
    tokenOut,
    reserveIn,
    reserveOut,
    totalSupply,
  } satisfies GetLiquidityResponse;
}

export async function waitForSwapResult(transferId: string): Promise<boolean> {
  try {
    await retryWithDelay(
      () => readSwapResult(transferId),
      1000,
      2000,
      (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    );

    return true;
  } catch (err) {
    log(LOG_GROUP.SWAP, "Error waiting for swap result", err);
    return false;
  }
}

export const permaswap = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
};
