import { swapsArray } from "./swap.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "./swap.types";
import { cleanupOldSwaps, startSwapMonitoring } from "./alarms/swap-monitor/swap-monitor-alarm.handler";
import { TempTransactionStorage } from "~utils/storage";

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
 * Check for completed or failed swaps that need to show completion screen
 * Returns the swap data of the first swap that should be shown
 */
export async function checkForCompletedSwapToShow(): Promise<SwapData | null> {
  try {
    // Find the first swap that needs to show completion screen (completed OR failed)
    const swapToShow = await swapsArray.find(
      (swap) => (swap.status === "completed" || swap.status === "failed") && swap.showCompletionScreen !== false,
    );

    if (!swapToShow) return null;

    await TempTransactionStorage.set("swap-data", swapToShow);

    // Clear the flag and remove swap if fully processed
    const swapIsFullyProcessed =
      (swapToShow.status === "completed" && swapToShow.wanderFeeSent) || swapToShow.status === "failed"; // Failed swaps don't need fee processing

    if (swapIsFullyProcessed) {
      // Remove the swap entirely - it's completed/failed and has been shown
      await swapsArray.removeWhere((swap) => swap.transferId === swapToShow.transferId);
      log(LOG_GROUP.SWAP, `Removed fully processed ${swapToShow.status} swap ${swapToShow.transferId} from storage`);
    } else {
      // Just clear the flag if fee processing is still pending (only for completed swaps)
      await swapsArray.updateWhere(
        (swap) => swap.transferId === swapToShow.transferId,
        (swap) => ({
          ...swap,
          showCompletionScreen: false,
        }),
      );
    }

    log(LOG_GROUP.SWAP, `Found ${swapToShow.status} swap ${swapToShow.transferId} to show completion screen`);
    return swapToShow;
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error checking for completed/failed swaps to show:", error);
    return null;
  }
}
