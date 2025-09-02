import { getKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "../../swap.types";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { queryClient } from "~utils/tanstack";
import { defaultOptions } from "~tokens/hooks";
import { createDataItemSigner, fetchTokenBalance, getBotegaPrice } from "~tokens/aoTokens/ao";
import { isWalletUnlocked } from "~wallets/auth";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { Mutex } from "~utils/mutex";
import BigNumber from "bignumber.js";
import { findGateway, retryWithGateways } from "~gateways/wayfinder";
import { getSetting } from "~settings";
import { EventType, trackDirect } from "~utils/analytics";
import { getDefiFeeDetailsForTier } from "~utils/tier/utils";
import { assertTransferResult, fromTokenBaseUnits, getFeeTransactionTags, toFixed } from "../../swap.utils";
import Arweave from "arweave";
import { WANDER_FEE_RECIPIENT } from "../../swap.constants";

const aoInstance = connect(defaultConfig);

// Mutex instances for each transaction to prevent duplicate fee processing
const feeProcessingMutexes = new Map<string, Mutex>();

/**
 * Process Wander fee for a completed swap
 * @param swap The completed swap data
 * @returns Promise<boolean> Whether the fee was successfully processed
 */
export async function processWanderFee(swap: SwapData): Promise<boolean> {
  if (!swap.transferId) {
    log(LOG_GROUP.SWAP, "Invalid swap data: missing transferId");
    return false;
  }

  // Get or create mutex for this transaction
  if (!feeProcessingMutexes.has(swap.transferId)) {
    feeProcessingMutexes.set(swap.transferId, new Mutex());
  }

  const mutex = feeProcessingMutexes.get(swap.transferId)!;
  const unlock = await mutex.lock();

  try {
    // Check if fee has already been processed (re-check inside mutex)
    if (swap.wanderFeeSent) {
      log(LOG_GROUP.SWAP, `Fee already processed for swap ${swap.transferId}`);
      return true;
    }

    if (!swap.wanderFee || !swap.sendToken || !swap.amountIn || !swap.swapper) {
      log(LOG_GROUP.SWAP, "Invalid swap data for fee processing", swap);
      return false;
    }

    // Skip if no fee to process
    const feeValue = extractFeeValue(swap.wanderFee.finalFee);
    if (!feeValue || feeValue.isZero()) {
      log(LOG_GROUP.SWAP, "No Wander fee to process");
      return true;
    }

    let decryptedWallet: DecryptedWallet;
    try {
      decryptedWallet = await getKeyfile(swap.swapper);

      const isUnlocked = await isWalletUnlocked();
      if (!isUnlocked && !swap.keystoneTx) {
        log(LOG_GROUP.SWAP, "Wallet is not unlocked");
        return false;
      }

      // Convert fee amount to the token's base units
      const quantity = feeValue.shiftedBy(swap.sendToken.Denomination).toFixed(0, BigNumber.ROUND_DOWN);

      const balance = await queryClient
        .fetchQuery({
          queryKey: ["tokenBalance", swap.sendToken.processId, swap.swapper],
          queryFn: async () => {
            const balance = await fetchTokenBalance(swap.sendToken, swap.swapper);
            return balance || "0";
          },
          ...defaultOptions,
        })
        .catch(() => "0");

      if (balance && BigNumber(balance).shiftedBy(swap.sendToken.Denomination).lt(quantity)) {
        log(LOG_GROUP.SWAP, `Not enough token ${swap.sendToken.Ticker} balance to process swap fee`);
        return false;
      }

      log(LOG_GROUP.SWAP, `Processing Wander fee: ${feeValue.toString()} ${swap.sendToken.Ticker}`);

      let feeTransferId: string;

      const poolType = swap.selectedPoolInfo.poolType;
      const isARSwap = (poolType === "aox" || poolType === "vento") && swap.sendToken.processId === AR_PROCESS_ID;

      const tags = getFeeTransactionTags(swap.transferId, !isARSwap);

      if (decryptedWallet.type === "local") {
        const keyfile = decryptedWallet.keyfile;

        if (isARSwap) {
          const { result: transaction, arweave } = await retryWithGateways((arweave) =>
            arweave.createTransaction({
              target: WANDER_FEE_RECIPIENT,
              quantity,
            }),
          );

          tags.forEach((tag) => transaction.addTag(tag.name, tag.value));

          await arweave.transactions.sign(transaction, keyfile);
          const result = await arweave.transactions.post(transaction);

          if (result.status !== 200) throw new Error("Failed to post transaction");

          feeTransferId = transaction.id;
        } else {
          const signer = createDataItemSigner(keyfile);
          feeTransferId = await aoInstance.message({
            process: swap.sendToken.processId,
            signer,
            tags: [
              { name: "Action", value: "Transfer" },
              { name: "Recipient", value: WANDER_FEE_RECIPIENT },
              { name: "Quantity", value: quantity },
              ...tags,
            ],
          });

          await assertTransferResult(feeTransferId, swap.sendToken.processId);
        }
      } else {
        if (isARSwap) {
          const gateway = await findGateway({ random: true });
          const arweave = new Arweave(gateway);
          const feeTx = arweave.transactions.fromRaw(swap.keystoneTx);

          const result = await arweave.transactions.post(feeTx);

          if (result.status !== 200) throw new Error("Failed to post transaction");

          feeTransferId = feeTx.id;
        } else {
          const dataItemRaw = Buffer.from(swap.keystoneTx.raw, "base64");

          const response = await fetch("https://mu.ao-testnet.xyz", {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              Accept: "application/json",
            },
            redirect: "follow",
            // @ts-ignore
            body: dataItemRaw,
          });

          if (!response.ok) throw new Error("Failed to post transaction");
          const result = await response.json();

          feeTransferId = result.id;

          await assertTransferResult(feeTransferId, swap.sendToken.processId);
        }
      }

      await trackSwapAnalytics(swap, "Success");

      log(LOG_GROUP.SWAP, `Wander fee transfer sent: ${feeTransferId}`);
      return true;
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error processing Wander fee", error);
      return false;
    } finally {
      // Clean up keyfile from memory
      if (decryptedWallet && decryptedWallet.type !== "hardware") {
        freeDecryptedWallet(decryptedWallet.keyfile);
      }
    }
  } finally {
    unlock();
  }
}

/**
 * Extract numeric fee amount from fee string
 * @param feeString Fee string like "0.05 USDA"
 * @returns BigNumber of the fee amount or null if invalid
 */
function extractFeeValue(feeString: string): BigNumber | null {
  try {
    if (!feeString || feeString === "--") {
      return null;
    }

    // Extract numeric part from strings like "0.05 USDA"
    const match = feeString.match(/^([\d.]+)/);
    if (!match) {
      return null;
    }

    const amount = new BigNumber(match[1]);
    return amount.isNaN() ? null : amount;
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error parsing fee amount", error);
    return null;
  }
}

/**
 * Clean up mutex for a completed transaction to free memory
 * @param transferId The transaction ID to clean up
 */
export function cleanupFeeProcessingMutex(transferId: string): void {
  if (feeProcessingMutexes.has(transferId)) {
    feeProcessingMutexes.delete(transferId);
    log(LOG_GROUP.SWAP, `Cleaned up fee processing mutex for ${transferId}`);
  }
}

export async function getTokenPrice(tokenId: string) {
  let price = 0;

  try {
    price = await queryClient.fetchQuery({
      queryKey: ["tokenPrice", tokenId],
      queryFn: () => getBotegaPrice(tokenId),
      ...defaultOptions,
    });
  } catch {}

  return price || 0;
}

export async function trackSwapAnalytics(swap: SwapData, status: "Success" | "Failed") {
  try {
    const enabled = await getSetting("analytics").getValue();
    if (!enabled) return;

    const defiFeeDetails = getDefiFeeDetailsForTier(swap.tier);
    const amountInBN = BigNumber(swap.amountIn);
    const valueInBN = fromTokenBaseUnits(amountInBN, swap.sendToken.Denomination, "BigNumber");
    const amountOutBN = BigNumber(swap.selectedPoolInfo.quoteOutput.amountOut);
    const valueOutBN = fromTokenBaseUnits(amountOutBN, swap.receiveToken.Denomination, "BigNumber");
    const originalFeeAmount = amountInBN
      .multipliedBy(defiFeeDetails.originalFeePercent)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_DOWN);
    const finalFeeAmount = amountInBN
      .multipliedBy(defiFeeDetails.finalFeePercent)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_DOWN);
    const finalFeeValueBN = fromTokenBaseUnits(finalFeeAmount, swap.sendToken.Denomination, "BigNumber");
    const discountFeeAmount = BigNumber(originalFeeAmount).minus(finalFeeAmount).toFixed(0, BigNumber.ROUND_DOWN);
    const discountFeeValueBN = fromTokenBaseUnits(discountFeeAmount, swap.sendToken.Denomination, "BigNumber");

    const sellTokenPrice = await getTokenPrice(swap.sendToken.processId);
    const buyTokenPrice = await getTokenPrice(swap.receiveToken.processId);

    const wanderFeeAmountUsd = toFixed(finalFeeValueBN.multipliedBy(sellTokenPrice), 6, BigNumber.ROUND_UP);
    const wanderFeeDiscountAmountUsd = toFixed(discountFeeValueBN.multipliedBy(sellTokenPrice), 6, BigNumber.ROUND_UP);
    const sellTokenAmountUsd = toFixed(valueInBN.multipliedBy(sellTokenPrice), 6, BigNumber.ROUND_UP);
    const buyTokenAmountUsd = toFixed(valueOutBN.multipliedBy(buyTokenPrice), 6, BigNumber.ROUND_UP);

    const swapCompletedData = {
      sellTokenName: swap.sendToken.Name,
      sellTokenProcessId: swap.sendToken.processId,
      sellTokenAmount: swap.amountIn,
      sellTokenAmountUsd,
      buyTokenName: swap.receiveToken.Name,
      buyTokenProcessId: swap.receiveToken.processId,
      buyTokenAmount: swap.selectedPoolInfo.quoteOutput.amountOut,
      buyTokenAmountUsd,
      provider: swap.selectedPoolInfo.poolType,
      status,
      userWanderTier: swap.tier,
      wanderFeeAmount: finalFeeAmount,
      wanderFeeAmountUsd,
      wanderFeeTokenName: swap.sendToken.Name,
      wanderFeeTokenProcessId: swap.sendToken.processId,
      wanderFeeDiscountAmount: discountFeeAmount,
      wanderFeeDiscountAmountUsd,
    };

    log(LOG_GROUP.SWAP, "Swap completed data: ", swapCompletedData);

    await trackDirect(EventType.SWAP_COMPLETED, swapCompletedData);
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error tracking swap analytics", error);
  }
}
