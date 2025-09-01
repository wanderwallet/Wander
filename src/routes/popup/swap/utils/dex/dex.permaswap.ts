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
  ReadSwapResult,
  ReadSwapResultResponse,
  SwapExecutionParams,
  SwapExecutionResponse,
  WaitForSwapResultResponse,
} from "./dex.types";
import { isLocalWallet } from "~utils/assertions";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { retryWithDelay } from "~utils/promises/retry";
import { freeDecryptedWallet } from "~wallets/encryption";
import { getLinkedMessages, OrderError } from "./dex.utils";
import { queryClient } from "~utils/tanstack";

const aoInstance = connect(defaultConfig);

enum SettlementStatus {
  Open = "Open",
  Started = "Started",
  Executing = "Executing",
  Settled = "Settled",
  Rejected = "Rejected",
  Timeout = "Timeout",
  Expired = "Expired",
  Canceled = "Canceled",
}

type SwapStatus = "pending" | "success" | "failed";

export function getSwapStatus(status: SettlementStatus): SwapStatus {
  switch (status) {
    case SettlementStatus.Settled:
      return "success";

    case SettlementStatus.Rejected:
    case SettlementStatus.Timeout:
    case SettlementStatus.Expired:
    case SettlementStatus.Canceled:
      return "failed";

    case SettlementStatus.Open:
    case SettlementStatus.Started:
    case SettlementStatus.Executing:
      return "pending";

    default:
      return "pending";
  }
}

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult({
  orderId,
  noteSettle,
  swapper,
}: ReadSwapResult): Promise<ReadSwapResultResponse> {
  // const result = await aoInstance.dryrun({
  //   process: poolId,
  //   tags: [
  //     { name: "Action", value: "GetSettled" },
  //     { name: "SettleID", value: orderId },
  //   ],
  // });
  // const data = JSON.parse(result?.Messages?.[0]?.Data);
  // const status = getSwapStatus(data.Status);

  // if (status === "success") {
  //   const swap = await swapsArray.find((s) => s.transferId === orderId);
  //   const amountOut = swap.selectedPoolInfo.quoteOutput.amountOut;
  //   return { amountOut, confirmationTxId: orderId };
  // } else if (status === "pending") {
  //   throw new Error("Order not settled");
  // } else if (status === "failed") {
  //   throw new OrderError(data.Status);
  // }

  const messages = await getLinkedMessages(undefined, undefined, false, orderId);

  const error = messages.find((msg) => msg.tags["Action"] === "Order-Error");
  if (error) throw new OrderError(error.tags["Result"]);

  const confirmation = messages.find(
    (msg) => msg.tags["Action"] === "Credit-Notice" && msg.tags["Sender"] === noteSettle && msg.to === swapper,
  );
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
export async function readRequestOrderResult(poolId: string, requestOrderId: string) {
  const result = await aoInstance.dryrun({
    process: poolId,
    tags: [
      { name: "Action", value: "GetNote" },
      { name: "MakeTx", value: requestOrderId },
    ],
  });

  const tags = result?.Messages?.[0]?.Tags || [];
  const noteId = getTagValue("NoteID", tags) || "";
  const noteSettle = getTagValue("NoteSettle", tags) || "";

  if (!noteId || !noteSettle) throw new Error("Failed to get note ID or settle for Permaswap order");

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
    .toFixed(0, BigNumber.ROUND_DOWN);
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
}: SwapExecutionParams): Promise<SwapExecutionResponse> {
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
      () => readRequestOrderResult(poolId, requestMessageId),
      20,
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

    return { transferId, noteSettle };
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

export async function waitForSwapResult(params: ReadSwapResult): Promise<WaitForSwapResultResponse> {
  try {
    const result = await retryWithDelay(
      () => readSwapResult(params),
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
