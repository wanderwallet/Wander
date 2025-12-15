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
import { OrderError } from "../dex/dex.utils";
import { retryWithDelay } from "~utils/promises/retry";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { queryClient } from "~utils/tanstack";
import { getAoxBridgeInfo, getAoxBridgeTransaction } from "./bridge.utils";
import { defaultOptions } from "~tokens/hooks";
import { retryWithGateways } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import { AR_PROCESS_ID, WAR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { createDataItemKeystoneSigner, createDataItemSigner, getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import BigNumber from "bignumber.js";
import type { AoxBridgeTransactionStatus } from "./bridge.types";
import type { JWKInterface } from "arweave/web/lib/wallet";
import type { HardwareWallet } from "~wallets/hardware";
import { assertTransferResult, createKeystoneFeeTransaction, createSwapMessage } from "../swap.utils";
import { createAoPendingTransaction, createArPendingTransaction } from "~utils/transactions/pending/pending.utils";

const FAILED_STATUSES = new Set<AoxBridgeTransactionStatus>(["failed", "submintAosFailed", "notOnChain", "refunded"]);

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult({ orderId }: ReadSwapResult): Promise<ReadSwapResultResponse> {
  const transaction = await getAoxBridgeTransaction(orderId);

  const isError = FAILED_STATUSES.has(transaction.status) || transaction?.errMsg === "refunded";
  if (isError) throw new OrderError(transaction.status);

  const statusSuccess = transaction.status === "success";
  if (!statusSuccess) throw new Error("Transaction not success yet");

  return { amountOut: transaction.quantity, confirmationTxId: transaction.targetChainTxHash };
}

const aoInstance = connect(defaultConfig);

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
  wanderFee,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  const bridgeInfo = await queryClient.fetchQuery({
    queryKey: ["aox-bridge-info"],
    queryFn: getAoxBridgeInfo,
    ...defaultOptions,
  });

  const isARToWAR = tokenIn === AR_PROCESS_ID;
  const amountInBN = BigNumber(amountIn);
  const mintOrBurnFee = isARToWAR ? bridgeInfo.warToken.mintFee : bridgeInfo.warToken.burnFee;
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
    tokenOutFee: isARToWAR ? "0" : providerFee.toFixed(0, BigNumber.ROUND_DOWN),
    tokenInFee: isARToWAR ? providerFee.toFixed(0, BigNumber.ROUND_DOWN) : "0",
    wanderFee,
    type: "aox",
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
    const bridgeInfo = await queryClient.fetchQuery({
      queryKey: ["aox-bridge-info"],
      queryFn: getAoxBridgeInfo,
      ...defaultOptions,
    });

    decryptedWallet = await getActiveKeyfile();

    // Get keyfile only for local wallets
    let keyfile: JWKInterface;
    if (!keystoneSigner) {
      isLocalWallet(decryptedWallet);
      keyfile = decryptedWallet.keyfile;
    }

    const activeAddress = await getActiveAddress();

    let transferId: string;
    let keystoneTx: SwapExecutionResponse["keystoneTx"];

    if (tokenIn === AR_PROCESS_ID) {
      const { result: transaction, arweave } = await retryWithGateways((arweave) =>
        arweave.createTransaction({
          target: bridgeInfo.arToken.locker,
          quantity: amountIn,
        }),
      );

      transaction.addTag("Type", "Transfer");
      transaction.addTag("Client", "Wander");
      transaction.addTag("Client-Version", browser.runtime.getManifest().version);
      tags.forEach((tag) => transaction.addTag(tag.name, tag.value));

      if (keystoneSigner) {
        const { id, signature } = await keystoneSigner.signTransaction(transaction);
        transaction.setSignature({ id, signature, owner: (decryptedWallet as HardwareWallet).publicKey });

        const feeTx = await createKeystoneFeeTransaction("aox", tokenIn, transaction.id, wanderFee, keystoneSigner);
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
        { name: "Recipient", value: activeAddress },
        { name: "Quantity", value: amountIn },
        { name: "Timestamp", value: Date.now().toString() },
        ...tags,
      ];

      const { keystoneTx: keystoneTx_, sendMessage } = await createSwapMessage({
        process: tokenIn,
        signer,
        tags: finalTags,
        wanderFee,
        poolType: "aox",
        keystoneSigner,
      });

      keystoneTx = keystoneTx_;
      transferId = await sendMessage();

      await assertTransferResult(transferId, tokenIn, ["Burn-Notice"], "Failed to unwrap WAR tokens");

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

    await retryWithDelay(async () => {
      const response = await fetch(`https://api.aox.xyz/cacheUnPackagedTx?timestamp=${Date.now()}`, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          txType: tokenIn === AR_PROCESS_ID ? "mint" : "burn",
          chainType: "arweave",
          tokenId: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          wrappedTokenId: WAR_PROCESS_ID,
          txId: transferId,
          sender: activeAddress,
          recipient: activeAddress,
          amount: amountIn,
        }),
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cache transaction");
    });

    // Invalidate transfered token balance
    queryClient.invalidateQueries({ queryKey: ["tokenBalance", tokenIn, activeAddress] });

    return { transferId, keystoneTx };
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

export const aox = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
  readSwapResult,
};
