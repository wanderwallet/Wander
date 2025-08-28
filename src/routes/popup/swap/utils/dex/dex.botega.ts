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
import { freeDecryptedWallet } from "~wallets/encryption";
import { isLocalWallet } from "~utils/assertions";
import { getLinkedMessages, OrderError } from "./dex.utils";
import { retryWithDelay } from "~utils/promises/retry";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { queryClient } from "~utils/tanstack";

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult(orderID: string): Promise<ReadSwapResultResponse> {
  const messages = await getLinkedMessages(undefined, undefined, false, orderID);

  const error = messages.find((msg) => msg.tags["Action"] === "Order-Error");
  if (error) throw new OrderError(error.tags["Result"]);

  const confirmation = messages.find((msg) => msg.tags["Action"] === "Order-Confirmation");
  if (!confirmation) throw new Error("Confirmation not found");

  const amountOut = confirmation.tags["To-Quantity"];
  if (!amountOut) throw new OrderError("Confirmation response malformed");

  console.log("onConfirmationId", confirmation.id);

  return { amountOut, confirmationTxId: confirmation.id };
}

const aoInstance = connect(defaultConfig);

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
      { name: "Action", value: "Get-Swap-Output" },
      { name: "Token", value: tokenIn },
      { name: "Quantity", value: amountInWithoutWanderFee },
      { name: "Swapper", value: swapper },
    ],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const amountOut = getTagValue("Output", tags) || "0";
  const lpFeeQuantity = getTagValue("LP-Fee-Quantity", tags) || "0";
  const protocolFeeQuantity = getTagValue("Protocol-Fee-Quantity", tags) || "0";
  const tokenOutFee = BigNumber(lpFeeQuantity).plus(protocolFeeQuantity).toFixed(0, BigNumber.ROUND_DOWN);
  const minAmountOut = BigNumber(amountOut)
    .multipliedBy(BigNumber(1).minus(slippage || 0))
    .div(100)
    .toFixed(0, BigNumber.ROUND_FLOOR);
  const poolAmountIn = amountInWithoutWanderFee;

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    wanderFee,
    minAmountOut,
    poolAmountIn,
    tokenOutFee,
    tokenInFee: "0",
    transferAmountIn: amountInWithoutWanderFee,
    type: "botega",
  } satisfies GetExpectedOutputResponse;
}

export async function executeSwap({
  tokenIn,
  amountIn,
  minAmountOut,
  poolId,
  tags = [],
  keystoneSigner,
}: SwapExecutionParams) {
  let decryptedWallet: DecryptedWallet;
  try {
    const swapNonce = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}`;

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

    const transferId = await aoInstance.message({
      process: tokenIn,
      signer,
      tags: [
        { name: "Action", value: "Transfer" },
        { name: "Recipient", value: poolId },
        { name: "Quantity", value: amountIn },
        { name: "X-Expected-Min-Output", value: minAmountOut },
        { name: "X-Swap-Nonce", value: swapNonce },
        { name: "X-Action", value: "Swap" },
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
    tags: [{ name: "Action", value: "Get-Reserves" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const reserveIn = getTagValue(tokenIn, tags) || "0";
  const reserveOut = getTagValue(tokenOut, tags) || "0";

  const infoResponse = await aoInstance.dryrun({
    process: poolId,
    tags: [{ name: "Action", value: "Info" }],
  });

  const infoTags = infoResponse?.Messages?.[0]?.Tags || [];
  const totalSupply = getTagValue("TotalSupply", infoTags) || "0";

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

export const botega = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
  readSwapResult,
};
