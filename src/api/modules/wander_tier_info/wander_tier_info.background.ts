import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ExtensionStorage } from "~utils/storage";
import { getActiveTier } from "~utils/tier/utils";
import type { ActiveTier } from "~utils/tier/types";

/**
 * Wander tier info API background module
 * Returns the active tier info for the current wallet
 */
const background: BackgroundModuleFunction<ActiveTier> = async (_) => {
  const activeAddress = await ExtensionStorage.get("active_address");
  if (!activeAddress) {
    throw new Error("No active address found");
  }

  // Get the active tier for the current wallet
  const activeTier = await getActiveTier(activeAddress, true);
  return activeTier;
};

export default background;
