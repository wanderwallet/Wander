import type { Alarms } from "webextension-polyfill";
import browser from "webextension-polyfill";
import { readSwapResultFn, swapsArray } from "../../swap.utils";
import { queryClient } from "~utils/tanstack";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "../../swap.types";
import { processWanderFee, cleanupFeeProcessingMutex, trackSwapAnalytics } from "./swap-fee-processor";
// import { sendSwapNotification } from "./swap-notifications";
import { OrderError } from "../../dex/dex.utils";
import { isWalletUnlocked } from "~wallets/auth";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { fetchTokenByProcessId, type TokenInfo } from "~tokens/aoTokens/ao";
import { ExtensionStorage } from "~utils/storage";
import { getAoTokens } from "~tokens";

const SWAP_MONITOR_ALARM_NAME = "swap-monitor";
const SWAP_CHECK_INTERVAL_MINUTES = 2; // Check every 2 minutes

/**
 * Background alarm handler for monitoring ongoing swaps.
 * Checks the status of pending swaps and processes completion/failure.
 */
export async function handleSwapMonitorAlarm(alarmInfo?: Alarms.Alarm) {
  if (alarmInfo?.name !== SWAP_MONITOR_ALARM_NAME) return;

  try {
    await checkPendingSwaps();
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error in swap monitor alarm", error);
  }

  // Schedule next check
  await scheduleNextSwapMonitorCheck();
}

/**
 * Check all pending swaps and update their status
 */
async function checkPendingSwaps() {
  // Check if wallet is unlocked - skip fee processing if locked
  const walletUnlocked = await isWalletUnlocked();

  // Get pending swaps (not yet completed/failed)
  const pendingSwaps = await swapsArray.filter(
    (swap) => swap.status !== "completed" && swap.status !== "failed" && !!swap.transferId,
  );

  // Get completed swaps that still need fee processing (only if wallet is unlocked or has keystone tx)
  const completedSwapsNeedingFees = await swapsArray.filter(
    (swap) =>
      swap.status === "completed" && !swap.wanderFeeSent && !!swap.transferId && (walletUnlocked || !!swap.keystoneTx),
  );

  const totalToProcess = pendingSwaps.length + completedSwapsNeedingFees.length;

  if (totalToProcess === 0) {
    if (walletUnlocked) {
      log(LOG_GROUP.SWAP, "No swaps to monitor");
    } else {
      log(LOG_GROUP.SWAP, "No swaps to monitor (wallet locked, no keystone transactions)");
    }
    return;
  }

  const feeProcessingNote = walletUnlocked
    ? ""
    : completedSwapsNeedingFees.length > 0
      ? " (wallet locked - processing keystone transactions only)"
      : " (wallet locked - no keystone transactions for fee processing)";

  log(
    LOG_GROUP.SWAP,
    `Checking ${pendingSwaps.length} pending swaps and ${completedSwapsNeedingFees.length} swaps needing fee processing${feeProcessingNote}`,
  );

  // Check pending swaps for completion (always check status regardless of lock state)
  for (const swap of pendingSwaps) {
    try {
      await checkSingleSwap(swap);
    } catch (error) {
      log(LOG_GROUP.SWAP, `Error checking swap ${swap.transferId}`, error);
    }
  }

  // Retry fee processing for completed swaps (wallet unlocked or keystone transactions)
  if (walletUnlocked || completedSwapsNeedingFees.length > 0) {
    for (const swap of completedSwapsNeedingFees) {
      try {
        await retryFeeProcessing(swap);
      } catch (error) {
        log(LOG_GROUP.SWAP, `Error retrying fee processing for swap ${swap.transferId}`, error);
      }
    }
  }
}

/**
 * Check the status of a single swap and process accordingly
 */
async function checkSingleSwap(swap: SwapData) {
  if (!swap.transferId || !swap.selectedPoolInfo) {
    log(LOG_GROUP.SWAP, "Invalid swap data", swap);
    return;
  }

  const poolType = swap.selectedPoolInfo.poolType;
  if (!poolType) {
    log(LOG_GROUP.SWAP, "Invalid pool type", swap);
    return;
  }

  try {
    const result = await readSwapResultFn(poolType, {
      orderId: swap.transferId,
      noteSettle: swap.noteSettle,
      swapper: swap.swapper,
      debitNoticeId: swap.debitNoticeId,
      isAo: swap.sendToken?.processId !== AR_PROCESS_ID,
    });
    const expectedOutput = swap.selectedPoolInfo.quoteOutput.amountOut;
    swap.selectedPoolInfo.quoteOutput.amountOut = result?.amountOut || expectedOutput;
    await handleSwapSuccess(swap);
  } catch (error) {
    if (error instanceof OrderError) {
      await handleSwapFailure(swap);
    } else {
      // If there's an error checking status, treat as potential failure after timeout
      const swapAge = Date.now() - (swap.timestamp || Date.now());
      const SWAP_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (swapAge > SWAP_TIMEOUT_MS) {
        log(LOG_GROUP.SWAP, `Swap ${swap.transferId} timed out with error after 7 days`, error);
        await handleSwapFailure(swap);
      }
    }
  }
}

/**
 * Handle successful swap completion
 */
async function handleSwapSuccess(swap: SwapData) {
  log(LOG_GROUP.SWAP, `Swap ${swap.transferId} completed successfully`);

  try {
    // Invalidate token balances to reflect the swap result
    if (swap.receiveToken?.processId) {
      queryClient.invalidateQueries({
        queryKey: ["tokenBalance", swap.receiveToken.processId, swap.swapper],
      });
    }

    if (swap.sendToken?.processId) {
      queryClient.invalidateQueries({
        queryKey: ["tokenBalance", swap.sendToken.processId, swap.swapper],
      });
    }

    // Process Wander fee
    const feeProcessed = await processWanderFee(swap);

    await swapsArray.updateWhere(
      (s) => s.transferId === swap.transferId && !s.wanderFeeSent,
      (s) => {
        const expectedOutput = s.selectedPoolInfo.quoteOutput.amountOut;
        s.selectedPoolInfo.quoteOutput.amountOut = swap.selectedPoolInfo.quoteOutput.amountOut || expectedOutput;
        return {
          ...s,
          status: "completed" as const,
          wanderFeeSent: feeProcessed,
          completedAt: Date.now(),
        };
      },
    );

    // Send success notification
    // await sendSwapNotification(swap, "success");

    // Mark swap to show completion screen when popup opens
    if (swap.transferId) {
      await markSwapForCompletionDisplay(swap.transferId);
    }

    // import receiving token
    await importToken(swap.receiveToken);

    log(LOG_GROUP.SWAP, `Swap ${swap.transferId} processed completely`);
  } catch (error) {
    log(LOG_GROUP.SWAP, `Error processing successful swap ${swap.transferId}`, error);
  }
}

/**
 * Handle failed swap
 */
async function handleSwapFailure(swap: SwapData) {
  log(LOG_GROUP.SWAP, `Swap ${swap.transferId} failed or timed out`);

  try {
    // Update swap status in storage
    await swapsArray.updateWhere(
      (s) => s.transferId === swap.transferId,
      (s) => ({
        ...s,
        status: "failed" as const,
        completedAt: Date.now(),
        showCompletionScreen: true, // Mark for display to user
      }),
    );

    await trackSwapAnalytics(swap, "Failed");

    // Send failure notification
    // await sendSwapNotification(swap, "failed");

    log(LOG_GROUP.SWAP, `Swap ${swap.transferId} marked as failed and queued for display`);

    // Mark for completion display (similar to successful swaps)
    await markSwapForCompletionDisplay(swap.transferId);
  } catch (error) {
    log(LOG_GROUP.SWAP, `Error processing failed swap ${swap.transferId}`, error);
  }
}

/**
 * Retry fee processing for completed swaps
 */
async function retryFeeProcessing(swap: SwapData) {
  const processingType = swap.keystoneTx ? "keystone transaction" : "local transaction";
  log(LOG_GROUP.SWAP, `Retrying fee processing for swap ${swap.transferId} (${processingType})`);

  try {
    // Double-check the current state from storage before processing
    const currentSwap = await swapsArray.find((s) => s.transferId === swap.transferId);
    if (!currentSwap || currentSwap.wanderFeeSent) {
      log(LOG_GROUP.SWAP, `Swap ${swap.transferId} fee already processed or swap not found`);
      return;
    }

    // Process Wander fee
    const feeProcessed = await processWanderFee(currentSwap);

    if (feeProcessed) {
      // Update swap status to mark fee as sent - only if not already marked
      await swapsArray.updateWhere(
        (s) => s.transferId === swap.transferId && !s.wanderFeeSent,
        (s) => ({
          ...s,
          wanderFeeSent: true,
          feeProcessedAt: Date.now(),
        }),
      );

      log(LOG_GROUP.SWAP, `Fee processing completed for swap ${swap.transferId}`);
      // Clean up mutex since fee processing is complete
      cleanupFeeProcessingMutex(swap.transferId);
      // Check if we can clean up this swap immediately
      await cleanupSwapIfReady(swap.transferId);
    } else {
      log(LOG_GROUP.SWAP, `Fee processing failed for swap ${swap.transferId}, will retry next cycle`);
    }
  } catch (error) {
    log(LOG_GROUP.SWAP, `Error in fee processing retry for swap ${swap.transferId}`, error);
  }
}

/**
 * Start monitoring swaps in the background
 * Only starts if not already running to prevent interrupting ongoing fee processing
 * @param forceRestart - If true, will clear existing alarm and restart (use with caution)
 */
export async function startSwapMonitoring(forceRestart: boolean = false) {
  // Check if monitoring is already active
  const existingAlarm = await browser.alarms.get(SWAP_MONITOR_ALARM_NAME);

  if (existingAlarm && !forceRestart) {
    log(LOG_GROUP.SWAP, "Swap monitoring is already active, not starting a new one");
    return;
  }

  if (existingAlarm && forceRestart) {
    log(LOG_GROUP.SWAP, "Force restarting swap monitoring (existing alarm will be cleared)");
    await browser.alarms.clear(SWAP_MONITOR_ALARM_NAME);
  }

  // Schedule immediate check
  await browser.alarms.create(SWAP_MONITOR_ALARM_NAME, {
    when: Date.now() + 1000, // Start in 1 second
  });

  log(LOG_GROUP.SWAP, "Swap monitoring started");
}

/**
 * Schedule the next swap monitor check
 */
async function scheduleNextSwapMonitorCheck() {
  // Check if wallet is unlocked for fee processing consideration
  const walletUnlocked = await isWalletUnlocked();

  const pendingSwaps = await swapsArray.filter(
    (swap) => swap.status !== "completed" && swap.status !== "failed" && !!swap.transferId,
  );

  // Only check for fee processing if wallet is unlocked or has keystone tx
  const completedSwapsNeedingFees = await swapsArray.filter(
    (swap) =>
      swap.status === "completed" && !swap.wanderFeeSent && !!swap.transferId && (walletUnlocked || !!swap.keystoneTx),
  );

  const totalToMonitor = pendingSwaps.length + completedSwapsNeedingFees.length;

  // Continue monitoring if there are pending swaps OR (completed swaps needing fee processing AND wallet is unlocked)
  if (totalToMonitor > 0) {
    await browser.alarms.create(SWAP_MONITOR_ALARM_NAME, {
      when: Date.now() + SWAP_CHECK_INTERVAL_MINUTES * 60 * 1000,
    });
    const monitoringNote = walletUnlocked
      ? ""
      : completedSwapsNeedingFees.length > 0
        ? " (wallet locked - monitoring keystone transactions)"
        : " (wallet locked)";

    log(
      LOG_GROUP.SWAP,
      `Next swap check scheduled in ${SWAP_CHECK_INTERVAL_MINUTES} minutes (${pendingSwaps.length} pending, ${completedSwapsNeedingFees.length} needing fees)${monitoringNote}`,
    );
  } else {
    if (walletUnlocked) {
      log(LOG_GROUP.SWAP, "No swaps to monitor, stopping monitoring");
    } else {
      log(LOG_GROUP.SWAP, "No swaps to monitor (wallet locked, no keystone transactions), stopping monitoring");
    }
  }
}

/**
 * Immediately clean up a swap if it's ready for removal
 * - Completed swaps: only if fee processed and doesn't need to be shown
 * - Failed swaps: only if completion screen has been shown
 */
async function cleanupSwapIfReady(transferId: string) {
  try {
    const swap = await swapsArray.find((s) => s.transferId === transferId);
    if (!swap) return;

    let shouldCleanup = false;
    let reason = "";

    // Completed swaps only if fee processed and doesn't need display
    if (swap.status === "completed" && swap.wanderFeeSent && swap.showCompletionScreen === false) {
      shouldCleanup = true;
      reason = "completed swap with fee processed and screen shown";
    }
    // Failed swaps only if completion screen has been shown
    else if (swap.status === "failed" && swap.showCompletionScreen === false) {
      shouldCleanup = true;
      reason = "failed swap with screen shown";
    }

    if (shouldCleanup) {
      await swapsArray.removeWhere((s) => s.transferId === transferId);
      cleanupFeeProcessingMutex(transferId);
      log(LOG_GROUP.SWAP, `Immediately cleaned up ${reason}: ${transferId}`);
    }
  } catch (error) {
    log(LOG_GROUP.SWAP, `Error in immediate cleanup for swap ${transferId}`, error);
  }
}

/**
 * Determine if a swap should be removed from storage
 * CRITICAL: Never remove swaps until fee processing succeeds - fees must be processed at any cost
 */
function shouldRemoveSwap(swap: SwapData, dayAgo: number): boolean {
  // Early return for pending swaps - never remove
  if (swap.status === "pending") {
    return false;
  }

  // Handle completed swaps
  if (swap.status === "completed") {
    // NEVER remove if fee hasn't been processed - keep trying forever
    if (!swap.wanderFeeSent) {
      return false;
    }
    // Remove ONLY if fee processed AND completion screen has been explicitly shown (false)
    // Logic: undefined -> keep, true -> keep, false -> remove
    if (swap.showCompletionScreen === false) {
      return true;
    }

    // Fallback: remove after 24 hours even if screen wasn't shown (safety measure)
    return (swap.completedAt || 0) < dayAgo;
  }

  // Handle failed swaps - remove if completion screen shown OR after 24 hours (fallback)
  if (swap.status === "failed") {
    // Remove if completion screen has been shown
    if (swap.showCompletionScreen === false) {
      return true;
    }
    // Fallback: remove after 24 hours even if screen wasn't shown (safety measure)
    return (swap.completedAt || 0) < dayAgo;
  }

  // Unknown status - don't remove to be safe
  return false;
}

/**
 * Clean up completed and failed swaps based on processing status and age
 * Removes swaps that have completed fee processing, been shown (if needed), or are old failures
 * CRITICAL: Never remove swaps until fee processing succeeds - fees must be processed at any cost
 */
export async function cleanupOldSwaps() {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours for failed swaps

  // Get swaps to be removed for mutex cleanup
  const swapsToRemove = await swapsArray.filter((swap) => shouldRemoveSwap(swap, dayAgo));

  // Early exit if nothing to clean up
  if (swapsToRemove.length === 0) {
    return;
  }

  // Clean up mutexes for swaps being removed
  for (const swap of swapsToRemove) {
    if (swap.transferId) {
      cleanupFeeProcessingMutex(swap.transferId);
    }
  }

  // Remove swaps from storage
  const removedCount = await swapsArray.removeWhere((swap) => shouldRemoveSwap(swap, dayAgo));

  log(LOG_GROUP.SWAP, `Cleaned up ${removedCount} processed/old swaps and their mutexes`);
}

/**
 * Mark a swap as needing to show completion screen when popup opens
 */
async function markSwapForCompletionDisplay(transferId: string) {
  try {
    await swapsArray.updateWhere(
      (swap) => swap.transferId === transferId && swap.showCompletionScreen !== true,
      (swap) => ({
        ...swap,
        showCompletionScreen: true,
      }),
    );
    log(LOG_GROUP.SWAP, `Marked swap ${transferId} to show completion screen on next popup open`);
  } catch (error) {
    log(LOG_GROUP.SWAP, `Failed to mark swap ${transferId} for completion display`, error);
  }
}

const importToken = async (token: TokenInfo) => {
  try {
    // Validate required fields first before doing any async operations
    if (!token.Name || !token.Ticker || isNaN(+token.Denomination)) return;

    const aoTokens = await getAoTokens();
    if (aoTokens.some(({ processId }) => processId === token.processId)) return;

    let tokenToImport: TokenInfo = {
      Name: token.Name,
      Ticker: token.Ticker,
      Denomination: token.Denomination,
      Logo: token.Logo,
      processId: token.processId,
      type: "asset",
    };

    if (!tokenToImport.Logo) {
      const tokenInfo = await fetchTokenByProcessId(token.processId);
      tokenToImport = { ...tokenToImport, Logo: tokenInfo.Logo };
    }

    if (!tokenToImport.Name || !tokenToImport.Ticker || isNaN(+tokenToImport.Denomination)) return;

    aoTokens.push(tokenToImport);
    await ExtensionStorage.set("ao_tokens", aoTokens);
  } catch {
    log(LOG_GROUP.SWAP, "Error importing token: ", token);
  }
};
