import type { Alarms } from "webextension-polyfill";
import browser from "webextension-polyfill";
import { readSwapResultFn, swapsArray } from "../../swap.utils";
import { queryClient } from "~utils/tanstack";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "../../swap.types";
import { processWanderFee, cleanupFeeProcessingMutex, trackSwapAnalytics } from "./swap-fee-processor";
import { OrderError } from "../../dex/dex.utils";
import { isWalletUnlocked } from "~wallets/auth";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { fetchTokenByProcessId, type TokenInfo } from "~tokens/aoTokens/ao";
import { ExtensionStorage } from "~utils/storage";
import { getAoTokens } from "~tokens";

const SWAP_MONITOR_ALARM_NAME = "swap-monitor";
const SWAP_CHECK_INTERVAL_MS = 120_000;
const MIN_TIME_BEFORE_RESTART_MS = 30000;
let isSwapMonitoringActive = false;

// Intervals for DEX swaps: 10s, 30s, 60s, 120s
const DEX_SWAP_CHECK_INTERVALS = [
  10_000, // 1st interval: 10 seconds
  30_000, // 2nd interval: 30 seconds
  60_000, // 3rd interval: 60 seconds
  120_000, // 4th+ interval: 120 seconds
];

/**
 * Background alarm handler for monitoring ongoing swaps.
 * Checks the status of pending swaps and processes completion/failure.
 */
export async function handleSwapMonitorAlarm(alarmInfo?: Alarms.Alarm) {
  if (alarmInfo?.name !== SWAP_MONITOR_ALARM_NAME) return;
  isSwapMonitoringActive = true;

  try {
    await checkPendingSwaps();
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error in swap monitor alarm", error);
  }

  // Schedule next check
  await scheduleNextSwapMonitorCheck().finally(() => {
    isSwapMonitoringActive = false;
  });
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
 * Get the check interval for a swap
 * @param swap The swap data
 */
function getCheckInterval(swap: SwapData): number {
  const poolType = swap.selectedPoolInfo.poolType;
  const isDexSwap = poolType === "botega" || poolType === "permaswap";

  // Non-DEX swaps: always 2 minutes
  if (!isDexSwap) return SWAP_CHECK_INTERVAL_MS;

  // DEX swaps: escalating intervals based on attempt count
  const attempts = swap.checkAttempts || 0;
  const intervalIndex = Math.min(attempts - 1, DEX_SWAP_CHECK_INTERVALS.length - 1);

  return DEX_SWAP_CHECK_INTERVALS[intervalIndex];
}

/**
 * Check if enough time has passed since the last check for this swap
 */
function shouldCheckSwapNow(swap: SwapData): boolean {
  // First check - always allow immediately
  if (!swap.lastCheckTime) return true;

  const nextInterval = getCheckInterval(swap);
  const timeSinceLastCheck = Date.now() - swap.lastCheckTime;

  return timeSinceLastCheck >= nextInterval;
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

  // Check if swap is a DEX swap
  const isDexSwap = poolType === "botega" || poolType === "permaswap";

  // Check if enough time has passed since the last check
  if (!shouldCheckSwapNow(swap)) {
    log(LOG_GROUP.SWAP, `Skipping ${isDexSwap ? "DEX" : "Bridge"} swap ${swap.transferId} - waiting for next check`);
    return;
  }

  // Update check attempts and last check time
  const updatedSwap = {
    ...swap,
    checkAttempts: (swap.checkAttempts || 0) + 1,
    lastCheckTime: Date.now(),
  };

  // Update the swap in storage with new check metadata
  await swapsArray.updateWhere(
    (s) => s.transferId === swap.transferId,
    (s) => ({
      ...s,
      checkAttempts: updatedSwap.checkAttempts,
      lastCheckTime: updatedSwap.lastCheckTime,
    }),
  );

  // Show next check timing for DEX swaps
  let nextCheckMessage = "";
  if (isDexSwap) {
    const intervalMs = getCheckInterval(updatedSwap);
    const intervalSeconds = Math.round(intervalMs / 1000);
    nextCheckMessage = `, next check in ${intervalSeconds}s`;
  }

  log(
    LOG_GROUP.SWAP,
    `Checking ${isDexSwap ? "DEX" : "Bridge"} swap ${swap.transferId} (attempt ${updatedSwap.checkAttempts}${nextCheckMessage})`,
  );

  try {
    const result = await readSwapResultFn(poolType, {
      orderId: swap.transferId,
      noteSettle: swap.noteSettle,
      swapper: swap.swapper,
      debitNoticeId: swap.debitNoticeId,
      isAo: swap.sendToken?.processId !== AR_PROCESS_ID,
    });
    const expectedOutput = swap.selectedPoolInfo.quoteOutput.amountOut;
    updatedSwap.selectedPoolInfo.quoteOutput.amountOut = result?.amountOut || expectedOutput;
    await handleSwapSuccess(updatedSwap);
  } catch (error) {
    if (error instanceof OrderError) {
      await handleSwapFailure(updatedSwap);
    } else {
      // If there's an error checking status, treat as potential failure after timeout
      const swapAge = Date.now() - (updatedSwap.timestamp || Date.now());
      const SWAP_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (swapAge > SWAP_TIMEOUT_MS) {
        log(LOG_GROUP.SWAP, `Swap ${updatedSwap.transferId} timed out with error after 7 days`, error);
        await handleSwapFailure(updatedSwap);
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
        showCompletionScreen: s?.showCompletionScreen ?? true, // Mark for display to user
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
    const timeUntilNextCheck = existingAlarm.scheduledTime - Date.now();
    if (timeUntilNextCheck > MIN_TIME_BEFORE_RESTART_MS && !isSwapMonitoringActive) {
      log(LOG_GROUP.SWAP, "Force restarting swap monitoring (existing alarm will be cleared)");
      await browser.alarms.clear(SWAP_MONITOR_ALARM_NAME);
    } else {
      log(LOG_GROUP.SWAP, "Skipping restart - next check is too soon");
      return;
    }
  }

  if (isSwapMonitoringActive) {
    log(LOG_GROUP.SWAP, "Swap monitoring is already active, skipping restart");
    return;
  }

  // Schedule immediate check
  await browser.alarms.create(SWAP_MONITOR_ALARM_NAME, {
    when: Date.now() + 1000, // Start in 1 second
  });

  log(LOG_GROUP.SWAP, "Swap monitoring started");
}

/**
 * Calculate the next check interval needed for all swaps
 */
function calculateNextCheckInterval(pendingSwaps: SwapData[]): number {
  let shortestInterval = SWAP_CHECK_INTERVAL_MS; // Default 2 minutes in ms

  for (const swap of pendingSwaps) {
    const poolType = swap.selectedPoolInfo.poolType;
    const isDexSwap = poolType === "botega" || poolType === "permaswap";

    if (isDexSwap) {
      const interval = getCheckInterval(swap);
      shortestInterval = Math.min(shortestInterval, interval);
    }
  }

  return shortestInterval;
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
    // Calculate the next check interval based on all swaps that need monitoring
    const nextCheckInterval = calculateNextCheckInterval([...pendingSwaps, ...completedSwapsNeedingFees]);

    await browser.alarms.create(SWAP_MONITOR_ALARM_NAME, { when: Date.now() + nextCheckInterval });
    const monitoringNote = walletUnlocked
      ? ""
      : completedSwapsNeedingFees.length > 0
        ? " (wallet locked - monitoring keystone transactions)"
        : " (wallet locked)";

    const nextCheckIntervalSeconds = Math.round(nextCheckInterval / 1000);

    log(
      LOG_GROUP.SWAP,
      `Next swap check scheduled in ${nextCheckIntervalSeconds} seconds (${pendingSwaps.length} pending, ${completedSwapsNeedingFees.length} needing fees)${monitoringNote}`,
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
        showCompletionScreen: swap?.showCompletionScreen ?? true,
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
