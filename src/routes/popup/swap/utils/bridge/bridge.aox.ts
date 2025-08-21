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
import { getLinkedMessages, OrderError } from "../dex/dex.utils";
import { retryWithDelay } from "~utils/promises/retry";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { queryClient } from "~utils/tanstack";
import { getBridgeInfo } from "./bridge.utils";
import { defaultOptions } from "~tokens/hooks";
import { findGateway } from "~gateways/wayfinder";
import Arweave from "arweave";
import browser from "webextension-polyfill";

/**
 * Fetch the result of a swap message
 */
export async function readSwapResult(orderID: string): Promise<[bigint, string]> {
  const messages = await getLinkedMessages(undefined, undefined, false, orderID);

  const error = messages.find((msg) => msg.tags["Action"] === "Order-Error");
  if (error) throw new OrderError(error.tags["Result"]);

  const confirmation = messages.find((msg) => msg.tags["Action"] === "Order-Confirmation");
  if (!confirmation) throw new Error("Confirmation not found");

  const tokensReceived = confirmation.tags["To-Quantity"];
  if (!tokensReceived) throw new OrderError("Confirmation response malformed");

  console.log("onConfirmationId", confirmation.id);

  return [BigInt(tokensReceived), confirmation.id];
}

const aoInstance = connect(defaultConfig);

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut: amountIn,
    expectedMinOutput: amountIn,
    amountInWithoutFee: amountIn,
    totalTokenOutFeeQuantity: "0",
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

    const activeAddress = await getActiveAddress();

    await retryWithDelay(async () => {
      const response = await fetch(`https://api.aox.xyz/cacheUnPackagedTx?timestamp=${Date.now()}`, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          txType: "mint",
          chainType: "arweave",
          tokenId: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          wrappedTokenId: tokenOut,
          txId: transaction.id,
          sender: activeAddress,
          recipient: activeAddress,
          amount: amountIn,
        }),
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cache transaction");

      return response.json();
    });

    // Invalidate transfered token balance
    queryClient.invalidateQueries({ queryKey: ["tokenBalance", tokenIn, activeAddress] });

    return transaction.id;
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

export const aox = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
  waitForSwapResult,
};
