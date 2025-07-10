import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ExtensionStorage } from "~utils/storage";
import { getActiveTier } from "~utils/tier/utils";
import type { ActiveTier } from "~utils/tier/types";

/**
 * Wander tier API background module
 * Returns the active tier for the current wallet
 */
const background: BackgroundModuleFunction<ActiveTier> = async (appData) => {
  const activeAddress = await ExtensionStorage.get("active_address");
  if (!activeAddress) {
    throw new Error("No active address found");
  }

  // Get the active tier for the current wallet
  const activeTier = await getActiveTier(activeAddress);
  return activeTier;
};

export default background;
