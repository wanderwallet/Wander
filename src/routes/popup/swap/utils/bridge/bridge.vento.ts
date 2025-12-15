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
import { getVentoBridgeInfo, getVentoBridgeTransaction } from "./bridge.utils";
import { retryWithGateways } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { createDataItemKeystoneSigner, createDataItemSigner, getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import BigNumber from "bignumber.js";
import { getLinkedMessages, OrderError } from "../dex/dex.utils";
import { defaultOptions } from "~tokens/hooks";
import type { JWKInterface } from "arweave/web/lib/wallet";
import type { HardwareWallet } from "~wallets/hardware";
import { assertTransferResult, createKeystoneFeeTransaction, createSwapMessage } from "../swap.utils";
import { createAoPendingTransaction, createArPendingTransaction } from "~utils/transactions/pending/pending.utils";

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
  const bridgeInfo = await queryClient.fetchQuery({
    queryKey: ["vento-bridge-info"],
    queryFn: getVentoBridgeInfo,
    ...defaultOptions,
  });

  const isARToVAR = tokenIn === AR_PROCESS_ID;
  const amountInBN = BigNumber(amountIn);
  const bridgeFeeRate = bridgeInfo.bridgeFeeRate || 0;
  const mintOrBurnFee = amountInBN.multipliedBy(bridgeFeeRate).toFixed(0, BigNumber.ROUND_DOWN);
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
  wanderFee,
  keystoneSigner,
}: SwapExecutionParams): Promise<SwapExecutionResponse> {
  let decryptedWallet: DecryptedWallet;
  try {
    decryptedWallet = await getActiveKeyfile();

    // Get keyfile only for local wallets
    let keyfile: JWKInterface;
    if (!keystoneSigner) {
      isLocalWallet(decryptedWallet);
      keyfile = decryptedWallet.keyfile;
    }

    const activeAddress = await getActiveAddress();

    let transferId: string;
    let debitNoticeId: string | undefined = undefined;
    let keystoneTx: SwapExecutionResponse["keystoneTx"];

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

      if (keystoneSigner) {
        const { id, signature } = await keystoneSigner.signTransaction(transaction);
        transaction.setSignature({ id, signature, owner: (decryptedWallet as HardwareWallet).publicKey });

        const feeTx = await createKeystoneFeeTransaction("vento", tokenIn, transaction.id, wanderFee, keystoneSigner);
        keystoneTx = feeTx.toJSON();
      } else {
        await arweave.transactions.sign(transaction, keyfile);
      }

      const result = await arweave.transactions.post(transaction);

      if (result.status !== 200) throw new Error("Failed to post transaction");

      // Save pending transaction to extension storage
      await createArPendingTransaction(transaction, activeAddress);

      transferId = transaction.id;
    } else {
      const signer = keystoneSigner ? createDataItemKeystoneSigner(keystoneSigner) : createDataItemSigner(keyfile);

      const finalTags = [
        { name: "Action", value: "Burn" },
        { name: "Forward-Wallet", value: activeAddress },
        { name: "Quantity", value: amountIn },
        ...tags,
      ];

      const { keystoneTx: keystoneTx_, sendMessage } = await createSwapMessage({
        process: tokenIn,
        signer,
        tags: finalTags,
        wanderFee,
        poolType: "vento",
        keystoneSigner,
      });

      keystoneTx = keystoneTx_;
      transferId = await sendMessage();

      await assertTransferResult(transferId, tokenIn, ["Debit-Notice"], "Failed to bridge token");

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

      await createAoPendingTransaction(
        transferId,
        decryptedWallet.address,
        tokenIn,
        amountIn,
        tokenIn,
        undefined,
        undefined,
        finalTags,
      );
    }

    // Invalidate transfered token balance
    queryClient.invalidateQueries({ queryKey: ["tokenBalance", tokenIn, activeAddress] });

    return { transferId, debitNoticeId, keystoneTx };
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
