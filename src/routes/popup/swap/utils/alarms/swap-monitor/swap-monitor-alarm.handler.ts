import type { Alarms } from "webextension-polyfill";
import browser from "webextension-polyfill";
import { readSwapResultFn, swapsArray } from "../../swap.utils";
import { queryClient } from "~utils/tanstack";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "../../swap.types";
import { processWanderFee, cleanupFeeProcessingMutex, trackSwapAnalytics } from "./swap-fee-processor";
// import { sendSwapNotification } from "./swap-notifications";
import { OrderError } from "../../dex/dex.utils";

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
  // Get pending swaps (not yet completed/failed)
  const pendingSwaps = await swapsArray.filter(
    (swap) => swap.status !== "completed" && swap.status !== "failed" && !!swap.transferId,
  );

  // Get completed swaps that still need fee processing
  const completedSwapsNeedingFees = await swapsArray.filter(
    (swap) => swap.status === "completed" && !swap.wanderFeeSent && !!swap.transferId,
  );

  const totalToProcess = pendingSwaps.length + completedSwapsNeedingFees.length;

  if (totalToProcess === 0) {
    log(LOG_GROUP.SWAP, "No swaps to monitor");
    return;
  }

  log(
    LOG_GROUP.SWAP,
    `Checking ${pendingSwaps.length} pending swaps and ${completedSwapsNeedingFees.length} swaps needing fee processing`,
  );

  // Check pending swaps for completion
  for (const swap of pendingSwaps) {
    try {
      await checkSingleSwap(swap);
    } catch (error) {
      log(LOG_GROUP.SWAP, `Error checking swap ${swap.transferId}`, error);
    }
  }

  // Retry fee processing for completed swaps
  for (const swap of completedSwapsNeedingFees) {
    try {
      await retryFeeProcessing(swap);
    } catch (error) {
      log(LOG_GROUP.SWAP, `Error retrying fee processing for swap ${swap.transferId}`, error);
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
      const maxWaitTime = 86400000;

      if (swapAge > maxWaitTime) {
        log(LOG_GROUP.SWAP, `Swap ${swap.transferId} timed out with error`, error);
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
      }),
    );

    await trackSwapAnalytics(swap, "Failed");

    // Send failure notification
    // await sendSwapNotification(swap, "failed");

    log(LOG_GROUP.SWAP, `Swap ${swap.transferId} marked as failed`);
  } catch (error) {
    log(LOG_GROUP.SWAP, `Error processing failed swap ${swap.transferId}`, error);
  }
}

/**
 * Retry fee processing for completed swaps
 */
async function retryFeeProcessing(swap: SwapData) {
  log(LOG_GROUP.SWAP, `Retrying fee processing for swap ${swap.transferId}`);

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
  const pendingSwaps = await swapsArray.filter(
    (swap) => swap.status !== "completed" && swap.status !== "failed" && !!swap.transferId,
  );

  const completedSwapsNeedingFees = await swapsArray.filter(
    (swap) => swap.status === "completed" && !swap.wanderFeeSent && !!swap.transferId,
  );

  const totalToMonitor = pendingSwaps.length + completedSwapsNeedingFees.length;

  // Continue monitoring if there are pending swaps OR completed swaps needing fee processing
  if (totalToMonitor > 0) {
    await browser.alarms.create(SWAP_MONITOR_ALARM_NAME, {
      when: Date.now() + SWAP_CHECK_INTERVAL_MINUTES * 60 * 1000,
    });
    log(
      LOG_GROUP.SWAP,
      `Next swap check scheduled in ${SWAP_CHECK_INTERVAL_MINUTES} minutes (${pendingSwaps.length} pending, ${completedSwapsNeedingFees.length} needing fees)`,
    );
  } else {
    log(LOG_GROUP.SWAP, "No swaps to monitor, stopping monitoring");
  }
}

/**
 * Clean up old completed swaps (older than 24 hours)
 * Only removes swaps that have completed fee processing or failed swaps
 */
export async function cleanupOldSwaps() {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  // Get swaps to be removed for mutex cleanup
  const swapsToRemove = await swapsArray.filter(
    (swap) =>
      ((swap.status === "completed" && swap.wanderFeeSent) || swap.status === "failed") &&
      (swap.completedAt || 0) < dayAgo,
  );

  // Clean up mutexes for swaps being removed
  swapsToRemove.forEach((swap) => {
    if (swap.transferId) {
      cleanupFeeProcessingMutex(swap.transferId);
    }
  });

  const removedCount = await swapsArray.removeWhere(
    (swap) =>
      ((swap.status === "completed" && swap.wanderFeeSent) || swap.status === "failed") &&
      (swap.completedAt || 0) < dayAgo,
  );

  if (removedCount > 0) {
    log(LOG_GROUP.SWAP, `Cleaned up ${removedCount} old completed swaps and their mutexes`);
  }
}

/**
 * Mark a swap as needing to show completion screen when popup opens
 */
async function markSwapForCompletionDisplay(transferId: string) {
  try {
    await swapsArray.updateWhere(
      (swap) => swap.transferId === transferId && typeof swap.showCompletionScreen !== "boolean",
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
