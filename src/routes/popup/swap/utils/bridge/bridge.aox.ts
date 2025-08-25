import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress, getActiveKeyfile, type DecryptedWallet } from "~wallets";
import type {
  GetExpectedOutputParams,
  GetExpectedOutputResponse,
  GetLiquidityParams,
  GetLiquidityResponse,
  SwapExecutionParams,
} from "../dex/dex.types";
import { freeDecryptedWallet } from "~wallets/encryption";
import { isLocalWallet } from "~utils/assertions";
import { OrderError } from "../dex/dex.utils";
import { retryWithDelay } from "~utils/promises/retry";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { queryClient } from "~utils/tanstack";
import { getBridgeInfo, getBridgeTransaction } from "./bridge.utils";
import { defaultOptions } from "~tokens/hooks";
import { findGateway } from "~gateways/wayfinder";
import Arweave from "arweave";
import browser from "webextension-polyfill";
import { AR_PROCESS_ID, WAR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { createDataItemSigner } from "~tokens/aoTokens/ao";
import type { DecodedTag } from "~api/modules/sign/tags";
import BigNumber from "bignumber.js";

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult(orderID: string): Promise<[bigint, string]> {
  const transaction = await getBridgeTransaction(orderID);

  const isError = transaction.status === "error";
  if (isError) throw new OrderError(transaction.status);

  const statusSuccess = transaction.status === "success";
  if (!statusSuccess) throw new Error("Transaction not success yet");

  return [BigInt(transaction.quantity), transaction.targetChainTxHash];
}

const aoInstance = connect(defaultConfig);

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  const bridgeInfo = await queryClient.fetchQuery({
    queryKey: ["bridge-info"],
    queryFn: getBridgeInfo,
    ...defaultOptions,
  });

  const fee = tokenIn === AR_PROCESS_ID ? bridgeInfo.warToken.mintFee : bridgeInfo.warToken.burnFee;

  const amountOut = BigNumber(amountIn).minus(fee).toFixed();

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    expectedMinOutput: amountOut,
    amountInWithoutFee: amountIn,
    totalTokenOutFeeQuantity: fee,
    totalTokenInFeeQuantity: "0",
    type: "aox",
  } satisfies GetExpectedOutputResponse;
}

export async function executeSwap({ tokenIn, amountIn, tokenOut }: SwapExecutionParams) {
  let decryptedWallet: DecryptedWallet;
  try {
    const bridgeInfo = await queryClient.fetchQuery({
      queryKey: ["bridge-info"],
      queryFn: getBridgeInfo,
      ...defaultOptions,
    });

    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const activeAddress = await getActiveAddress();

    let transferId: string;

    if (tokenIn === AR_PROCESS_ID) {
      const gateway = await findGateway({ random: true });
      const arweave = new Arweave(gateway);
      const transaction = await arweave.createTransaction({
        target: bridgeInfo.arToken.locker,
        quantity: amountIn,
      });

      transaction.addTag("Type", "Transfer");
      transaction.addTag("Client", "Wander");
      transaction.addTag("Client-Version", browser.runtime.getManifest().version);

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
          { name: "Recipient", value: activeAddress },
          { name: "Quantity", value: amountIn },
          { name: "Timestamp", value: Date.now().toString() },
          { name: "X-App-Name", value: "Wander" },
          { name: "X-Tx-Type", value: "Swap" },
        ],
      });

      let transferError = "";

      try {
        const { Error, Messages } = await aoInstance.result({ message: transferId, process: tokenIn });
        if (Error) {
          transferError = "Failed to unwrap WAR tokens";
        } else if (Messages.length === 0) {
          const hasValidTag = Messages.some((message) =>
            message?.Tags?.some((tag: DecodedTag) => tag.name === "Action" && tag.value === "Burn-Notice"),
          );

          if (!hasValidTag) {
            transferError = "Failed to unwrap WAR tokens";
          }
        }
      } catch {}

      if (transferError) {
        log(LOG_GROUP.SWAP, transferError);
        throw new Error(transferError);
      }
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
  return {
    poolId,
    tokenIn,
    tokenOut,
    reserveIn: "0",
    reserveOut: "0",
    totalSupply: "0",
  } satisfies GetLiquidityResponse;
}

export async function waitForSwapResult(transferId: string): Promise<boolean> {
  try {
    await retryWithDelay(() => readSwapResult(transferId), 1000, 300000);

    return true;
  } catch (err) {
    log(LOG_GROUP.SWAP, "Error waiting for swap result", err);
    return false;
  }
}

export const aox = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
};
