import type { StorageChange } from "~utils/runtime";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import { getActiveTab } from "~applications";
import Application from "~applications/application";
import { createContextMenus } from "~utils/context_menus";
import { initializeSwapMonitoring } from "~routes/popup/swap/utils/swap.progress";
import { log, LOG_GROUP } from "~utils/log/log.utils";

/**
 * Auth state change listener. Handles wallet lock/unlock events.
 * Updates UI and restarts swap monitoring when wallet unlocks.
 */
export async function handleAuthStateChange({ oldValue, newValue }: StorageChange<string>) {
  // Check if wallet was just unlocked (no old key, now has key)
  const wasLocked = !oldValue;
  const nowUnlocked = !!newValue;

  if (wasLocked && nowUnlocked) {
    log(LOG_GROUP.SETUP, "Wallet unlocked, checking for pending swap monitoring");
    // Wallet was just unlocked - restart swap monitoring if needed
    try {
      await initializeSwapMonitoring();
    } catch (error) {
      log(LOG_GROUP.SETUP, "Error restarting swap monitoring after unlock", error);
    }
  }

  // Update icon and context menus
  const activeTab = await getActiveTab();
  const app = new Application(getAppURL(activeTab.url));
  const connected = await app.isConnected();

  await updateIcon(connected);
  createContextMenus(connected);
}
