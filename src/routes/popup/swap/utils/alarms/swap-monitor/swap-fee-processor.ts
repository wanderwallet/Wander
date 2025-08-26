import { getKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "../../swap.types";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { queryClient } from "~utils/tanstack";
import { defaultOptions } from "~tokens/hooks";
import { createDataItemSigner, fetchTokenBalance, getBotegaPrice } from "~tokens/aoTokens/ao";
import { isLocalWallet } from "~utils/assertions";
import { isWalletUnlocked } from "~wallets/auth";
import { AO_PROCESS_ID, AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { Mutex } from "~utils/mutex";
import BigNumber from "bignumber.js";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { findGateway } from "~gateways/wayfinder";
import type { DecodedTag } from "~api/modules/sign/tags";
import { getSetting } from "~settings";
import { trackEvent, EventType } from "~utils/analytics";
import { getDefiFeeDetailsForTier } from "~utils/tier/utils";

// TODO: Replace with actual recipient CDoilQgKg6Pmp4Q0LJ4d84VXRgB3Ay9pIJ_SA617cVk
const WANDER_FEE_RECIPIENT = "C4ckfndXuRWYgs_5h-zwCuOBbJWer0ostMmDNy9sTCA";

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

    const isUnlocked = await isWalletUnlocked();
    if (!isUnlocked) {
      log(LOG_GROUP.SWAP, "Wallet is not unlocked");
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
      isLocalWallet(decryptedWallet);

      const keyfile = decryptedWallet.keyfile;
      const signer = createDataItemSigner(keyfile);

      // Convert fee amount to the token's base units
      const quantity = feeValue.shiftedBy(swap.sendToken.Denomination).toFixed(0, BigNumber.ROUND_DOWN);

      const balance = await queryClient.fetchQuery({
        queryKey: ["tokenBalance", AO_PROCESS_ID, swap.swapper],
        queryFn: async () => {
          try {
            const balance = await fetchTokenBalance(swap.sendToken, swap.swapper);
            return balance || "0";
          } catch {
            return "0";
          }
        },
        ...defaultOptions,
      });

      if (balance && BigNumber(balance).shiftedBy(swap.sendToken.Denomination).lt(quantity)) {
        log(LOG_GROUP.SWAP, `Not enough token ${swap.sendToken.Ticker} balance to process swap fee`);
        return false;
      }

      log(LOG_GROUP.SWAP, `Processing Wander fee: ${feeValue.toString()} ${swap.sendToken.Ticker}`);

      let feeTransferId: string;

      const tags = [
        { name: "Type", value: "Transfer" },
        { name: "Fee-Type", value: "Swap" },
        { name: "Swap-Tx-Id", value: swap.transferId || "" },
        { name: "Client", value: "Wander" },
        { name: "Client-Version", value: browser.runtime.getManifest().version },
      ];

      const isARSwap = swap.selectedPoolInfo.pool.poolType === "aox" && swap.sendToken.processId === AR_PROCESS_ID;

      if (isARSwap) {
        const gateway = await findGateway({ random: true });
        const arweave = new Arweave(gateway);
        const transaction = await arweave.createTransaction({
          target: WANDER_FEE_RECIPIENT,
          quantity,
        });

        tags.forEach((tag) => transaction.addTag(tag.name, tag.value));

        await arweave.transactions.sign(transaction, keyfile);
        const result = await arweave.transactions.post(transaction);

        if (result.status !== 200) throw new Error("Failed to post transaction");

        feeTransferId = transaction.id;
      } else {
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

        let transferError = "";

        try {
          const { Error, Messages } = await aoInstance.result({
            message: feeTransferId,
            process: swap.sendToken.processId,
          });
          if (Error) {
            transferError = "Failed to send fee";
          } else if (Messages.length > 0) {
            const hasValidTag = Messages.some((message) =>
              message?.Tags?.some(
                (tag: DecodedTag) =>
                  tag.name === "Action" && (tag.value === "Credit-Notice" || tag.value === "Debit-Notice"),
              ),
            );

            if (!hasValidTag) {
              transferError = "Failed to send fee";
            }
          }
        } catch {}

        if (transferError) {
          log(LOG_GROUP.SWAP, transferError);
          throw new Error(transferError);
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
 * Check if a swap should have its fee processed
 * @param swap The swap data to check
 * @returns boolean Whether fee processing is needed
 */
export function shouldProcessFee(swap: SwapData): boolean {
  return (
    swap.status === "completed" &&
    swap.wanderFeeSent !== true &&
    !!swap.wanderFee &&
    swap.wanderFee.finalFee !== "--" &&
    !!swap.sendToken &&
    !!swap.amountIn
  );
}

/**
 * Estimate if fee processing will succeed (for validation)
 * @param swap The swap data
 * @returns Promise<boolean> Whether fee processing is likely to succeed
 */
export async function canProcessFee(swap: SwapData): Promise<boolean> {
  try {
    if (!swap.wanderFee || !swap.sendToken) return false;

    const feeValue = extractFeeValue(swap.wanderFee.finalFee);
    return feeValue !== null && !feeValue.isZero();
  } catch {
    return false;
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

  return price;
}

export async function trackSwapAnalytics(swap: SwapData, status: "Success" | "Failed") {
  try {
    const enabled = await getSetting("analytics").getValue();
    if (!enabled) return;

    const defiFeeDetails = getDefiFeeDetailsForTier(swap.tier);
    const amountInBN = BigNumber(swap.amountIn);
    const amountOutBN = BigNumber(swap.selectedPoolInfo.quoteOutput.amountOut);
    const originalFee = amountInBN
      .multipliedBy(defiFeeDetails.originalFeePercent)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_DOWN);
    const finalFee = amountInBN
      .multipliedBy(defiFeeDetails.finalFeePercent)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_DOWN);
    const discountFee = BigNumber(originalFee).minus(finalFee).toFixed(0, BigNumber.ROUND_DOWN);

    const buyTokenPrice = await getTokenPrice(swap.sendToken.processId);
    const sellTokenPrice = await getTokenPrice(swap.receiveToken.processId);

    const wanderFeeAmountUsd = BigNumber(finalFee).multipliedBy(buyTokenPrice).toFixed();
    const wanderFeeDiscountAmountUsd = BigNumber(discountFee).multipliedBy(buyTokenPrice).toFixed();
    const buyTokenAmountUsd = amountInBN.multipliedBy(buyTokenPrice).toFixed();
    const sellTokenAmountUsd = amountOutBN.multipliedBy(sellTokenPrice).toFixed();

    const swapCompletedData = {
      buyTokenName: swap.sendToken.Name,
      buyTokenProcessId: swap.sendToken.processId,
      buyTokenAmount: swap.amountIn,
      buyTokenAmountUsd,
      sellTokenName: swap.receiveToken.Name,
      sellTokenProcessId: swap.receiveToken.processId,
      sellTokenAmount: swap.amountIn,
      sellTokenAmountUsd,
      provider: swap.selectedPoolInfo.pool.poolType,
      status,
      userWanderTier: swap.tier,
      wanderFeeAmount: finalFee,
      wanderFeeAmountUsd,
      wanderFeeTokenName: swap.sendToken.Name,
      wanderFeeTokenProcessId: swap.sendToken.processId,
      wanderFeeDiscountAmount: discountFee,
      wanderFeeDiscountAmountUsd,
    };

    log(LOG_GROUP.SWAP, "Swap completed data: ", swapCompletedData);

    await trackEvent(EventType.SWAP_COMPLETED, swapCompletedData);
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error tracking swap analytics", error);
  }
}
