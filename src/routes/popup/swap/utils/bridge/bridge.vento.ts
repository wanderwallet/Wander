import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress, getActiveKeyfile, type DecryptedWallet } from "~wallets";
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
} from "../dex/dex.types";
import { freeDecryptedWallet } from "~wallets/encryption";
import { isLocalWallet } from "~utils/assertions";
import { retryWithDelay } from "~utils/promises/retry";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { queryClient } from "~utils/tanstack";
import { getVentoBridgeTransaction } from "./bridge.utils";
import { retryWithGateways } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { createDataItemSigner } from "~tokens/aoTokens/ao";
import type { DecodedTag } from "~api/modules/sign/tags";
import BigNumber from "bignumber.js";
import { getLinkedMessages, OrderError } from "../dex/dex.utils";

export const VENTO_BRIDGE_ADDRESS = "mFRKcHsO6Tlv2E2wZcrcbv3mmzxzD7vYPbyybI3KCVA";

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult({
  orderId,
  debitNoticeId,
  isAo,
}: ReadSwapResult): Promise<ReadSwapResultResponse> {
  const transaction = await getVentoBridgeTransaction(debitNoticeId || orderId, isAo);

  if (transaction.status === "failed") {
    throw new OrderError("Failed to bridge token");
  }

  if (transaction.failureReason) {
    throw new OrderError(transaction.failureReason);
  }

  if (transaction.status !== "filled") {
    throw new Error("Transaction not filled yet");
  }

  return { amountOut: transaction.outputAmountRaw, confirmationTxId: transaction.outputTxId };
}

const aoInstance = connect(defaultConfig);

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
  wanderFee,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  const isARToVAR = tokenIn === AR_PROCESS_ID;
  const amountInBN = BigNumber(amountIn);
  // const mintOrBurnFee = amountInBN.dividedBy(100).toFixed(0, BigNumber.ROUND_DOWN); // 1% fee
  const mintOrBurnFee = "0"; // 0% fee
  const providerFee = BigNumber(mintOrBurnFee);
  const totalFee = BigNumber(mintOrBurnFee).plus(wanderFee);
  const transferAmountIn = amountInBN.minus(wanderFee).toFixed(0, BigNumber.ROUND_DOWN);
  const amountOut = amountInBN.minus(totalFee).toFixed(0, BigNumber.ROUND_DOWN);

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    transferAmountIn,
    minAmountOut: amountOut,
    poolAmountIn: transferAmountIn,
    tokenOutFee: isARToVAR ? "0" : providerFee.toFixed(0, BigNumber.ROUND_DOWN),
    tokenInFee: isARToVAR ? providerFee.toFixed(0, BigNumber.ROUND_DOWN) : "0",
    wanderFee,
    type: "vento",
  } satisfies GetExpectedOutputResponse;
}

export async function executeSwap({
  tokenIn,
  amountIn,
  tags = [],
}: SwapExecutionParams): Promise<SwapExecutionResponse> {
  let decryptedWallet: DecryptedWallet;
  try {
    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const activeAddress = await getActiveAddress();

    let transferId: string;
    let debitNoticeId: string | undefined = undefined;

    if (tokenIn === AR_PROCESS_ID) {
      const { result: transaction, arweave } = await retryWithGateways((arweave) =>
        arweave.createTransaction({
          target: VENTO_BRIDGE_ADDRESS,
          quantity: amountIn,
        }),
      );

      transaction.addTag("Type", "Transfer");
      transaction.addTag("Action", "BridgeARToVAR");
      transaction.addTag("Client", "Wander");
      transaction.addTag("Client-Version", browser.runtime.getManifest().version);
      transaction.addTag("Forward-Wallet", activeAddress);
      tags.forEach((tag) => transaction.addTag(tag.name, tag.value));

      await arweave.transactions.sign(transaction, keyfile);
      const result = await arweave.transactions.post(transaction);

      if (result.status !== 200) throw new Error("Failed to post transaction");

      transferId = transaction.id;
    } else {
      const signer = createDataItemSigner(keyfile);

      transferId = await aoInstance.message({
        process: tokenIn,
        signer,
        tags: [
          { name: "Action", value: "Burn" },
          { name: "Forward-Wallet", value: activeAddress },
          { name: "Quantity", value: amountIn },
          ...tags,
        ],
      });

      let transferError = "";

      try {
        const { Error, Messages } = await aoInstance.result({ message: transferId, process: tokenIn });
        if (Error) {
          transferError = "Failed to unwrap vAR tokens";
        } else if (Messages.length > 0) {
          const hasValidTag = Messages.some((message) =>
            message?.Tags?.some(
              (tag: DecodedTag) =>
                (tag.name === "Event" && tag.value === "Burn") ||
                (tag.name === "Action" && tag.value === "Debit-Notice"),
            ),
          );

          if (!hasValidTag) {
            transferError = "Failed to unwrap vAR tokens";
          }
        }
      } catch {}

      if (transferError) {
        log(LOG_GROUP.SWAP, transferError);
        throw new Error(transferError);
      }

      debitNoticeId = await retryWithDelay(
        async () => {
          const messages = await getLinkedMessages(undefined, undefined, false, transferId);
          const debitNotice = messages.find((msg) => msg.tags["Action"] === "Debit-Notice");
          if (!debitNotice) throw new Error("Debit notice not found");
          return debitNotice.id;
        },
        20,
        1000,
        (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      ).catch(() => undefined);
    }

    // Invalidate transfered token balance
    queryClient.invalidateQueries({ queryKey: ["tokenBalance", tokenIn, activeAddress] });

    return { transferId, debitNoticeId };
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
  return {
    poolId,
    tokenIn,
    tokenOut,
    reserveIn: "0",
    reserveOut: "0",
    totalSupply: "0",
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

export const vento = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
  readSwapResult,
};
