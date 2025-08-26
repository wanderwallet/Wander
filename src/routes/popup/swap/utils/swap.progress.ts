import { swapsArray } from "./swap.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "./swap.types";
import { cleanupOldSwaps, startSwapMonitoring } from "./alarms/swap-monitor/swap-monitor-alarm.handler";

/**
 * Initialize swap monitoring system
 * Should be called when the extension starts up
 */
export async function initializeSwapMonitoring() {
  try {
    // Clean up old completed swaps first
    await cleanupOldSwaps();

    // Check if there are any pending swaps to monitor OR completed swaps needing fee processing
    const pendingSwaps = await swapsArray.filter(
      (swap) =>
        (swap.status !== "completed" && swap.status !== "failed" && !!swap.transferId && !!swap.monitoringStarted) ||
        (swap.status === "completed" && !swap.wanderFeeSent && !!swap.transferId),
    );

    if (pendingSwaps.length > 0) {
      log(LOG_GROUP.SWAP, `Found ${pendingSwaps.length} pending swaps, starting monitoring`);
      await startSwapMonitoring();
    } else {
      log(LOG_GROUP.SWAP, "No pending swaps found");
    }
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error initializing swap monitoring", error);
  }
}

/**
 * Get all pending swaps that need monitoring
 */
export async function getPendingSwaps(): Promise<SwapData[]> {
  return await swapsArray.filter(
    (swap) => swap.status !== "completed" && swap.status !== "failed" && !!swap.transferId,
  );
}

/**
 * Get all completed swaps
 */
export async function getCompletedSwaps(): Promise<SwapData[]> {
  return await swapsArray.filter((swap) => swap.status === "completed");
}

/**
 * Get all failed swaps
 */
export async function getFailedSwaps(): Promise<SwapData[]> {
  return await swapsArray.filter((swap) => swap.status === "failed");
}

/**
 * Get swaps that need fee processing
 */
export async function getSwapsNeedingFeeProcessing(): Promise<SwapData[]> {
  return await swapsArray.filter((swap) => swap.status === "completed" && !swap.wanderFeeSent && !!swap.transferId);
}

/**
 * Get swap by transfer ID
 */
export async function getSwapByTransferId(transferId: string): Promise<SwapData | undefined> {
  return await swapsArray.find((swap) => swap.transferId === transferId);
}

/**
 * Mark a swap as completed or failed
 */
export async function markSwapCompleted(
  transferId: string,
  options: { status: "completed" | "failed"; wanderFeeSent?: boolean } = { status: "completed" },
): Promise<void> {
  await swapsArray.updateWhere(
    (swap) => swap.transferId === transferId,
    (swap) => ({
      ...swap,
      status: options.status,
      wanderFeeSent: options.wanderFeeSent || false,
      completedAt: Date.now(),
    }),
  );
}

/**
 * Remove old swaps from storage
 * @param olderThanHours Remove swaps older than this many hours
 */
export async function removeOldSwaps(olderThanHours: number = 24): Promise<number> {
  const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

  return await swapsArray.removeWhere(
    (swap) =>
      ((swap.status === "completed" && swap.wanderFeeSent) || swap.status === "failed") &&
      ((swap.completedAt && swap.completedAt < cutoffTime) ||
        (!swap.completedAt && swap.timestamp && swap.timestamp < cutoffTime)),
  );
}

/**
 * Get swap statistics for monitoring
 */
export async function getSwapStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
  needsFeeProcessing: number;
}> {
  const allSwaps = await swapsArray.getAll();

  const pending = allSwaps.filter((s) => s.status !== "completed" && s.status !== "failed" && !!s.transferId).length;
  const completed = allSwaps.filter((s) => s.status === "completed").length;
  const failed = allSwaps.filter((s) => s.status === "failed").length;
  const needsFeeProcessing = allSwaps.filter(
    (s) => s.status === "completed" && !s.wanderFeeSent && s.wanderFee?.finalFee !== "--",
  ).length;

  return {
    total: allSwaps.length,
    pending,
    completed,
    failed,
    needsFeeProcessing,
  };
}
