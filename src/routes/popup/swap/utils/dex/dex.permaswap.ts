import { connect } from "@permaweb/aoconnect";
import { createDataItemKeystoneSigner, createDataItemSigner, getTagValue } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress, getActiveKeyfile, type DecryptedWallet } from "~wallets";
import BigNumber from "bignumber.js";
import type {
  GetExpectedOutputParams,
  GetExpectedOutputResponse,
  GetLiquidityParams,
  GetLiquidityResponse,
  ReadSwapResultResponse,
  SwapExecutionParams,
  WaitForSwapResultResponse,
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
export async function readSwapResult(orderID: string): Promise<ReadSwapResultResponse> {
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

  const amountOut = confirmation.tags["Quantity"];
  if (!amountOut) throw new OrderError("Confirmation response malformed");

  console.log("onConfirmationId", confirmation.id);

  return { amountOut, confirmationTxId: confirmation.id };
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
  wanderFee,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  swapper = swapper || (await getActiveAddress());
  const amountInWithoutWanderFee = BigNumber(amountIn).minus(wanderFee).toFixed(0, BigNumber.ROUND_DOWN);
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [
      { name: "Action", value: "GetAmountOut" },
      { name: "TokenIn", value: tokenIn },
      { name: "AmountIn", value: amountInWithoutWanderFee },
    ],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const amountOut = getTagValue("AmountOut", tags) || "0";
  const issuerFeeQuantity = getTagValue("IssuerFee", tags) || "0";
  const poolFeeQuantity = getTagValue("PoolFee", tags) || "0";
  const holderFeeQuantity = getTagValue("HolderFee", tags) || "0";
  const tokenInFee = BigNumber(issuerFeeQuantity).plus(poolFeeQuantity).toFixed(0, BigNumber.ROUND_DOWN);
  const tokenOutFee = BigNumber(holderFeeQuantity).toFixed(0, BigNumber.ROUND_DOWN);
  const minAmountOut = BigNumber(amountOut)
    .multipliedBy(BigNumber(1).minus(slippage))
    .div(100)
    .toFixed(0, BigNumber.ROUND_FLOOR);
  const poolAmountIn = BigNumber(amountInWithoutWanderFee).minus(tokenInFee).toFixed(0, BigNumber.ROUND_DOWN);

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    wanderFee,
    minAmountOut,
    poolAmountIn,
    tokenInFee,
    tokenOutFee,
    transferAmountIn: amountInWithoutWanderFee,
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
  keystoneSigner,
}: SwapExecutionParams) {
  let decryptedWallet: DecryptedWallet;
  try {
    decryptedWallet = await getActiveKeyfile();

    let signer;
    if (keystoneSigner) {
      // Hardware wallet case
      signer = createDataItemKeystoneSigner(keystoneSigner);
    } else {
      // Local wallet case
      isLocalWallet(decryptedWallet);
      const keyfile = decryptedWallet.keyfile;
      signer = createDataItemSigner(keyfile);
    }

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
    if (decryptedWallet && decryptedWallet.type !== "hardware" && !keystoneSigner) {
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

export async function waitForSwapResult(transferId: string): Promise<WaitForSwapResultResponse> {
  try {
    const result = await retryWithDelay(
      () => readSwapResult(transferId),
      1000,
      2000,
      (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    );

    return { success: true, result };
  } catch (err) {
    log(LOG_GROUP.SWAP, "Error waiting for swap result", err);
    return { success: false, result: null };
  }
}

export const permaswap = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
  readSwapResult,
};
