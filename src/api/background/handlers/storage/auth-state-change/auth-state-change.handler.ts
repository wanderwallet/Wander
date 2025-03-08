import type { StorageChange } from "~utils/runtime";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import { getActiveTab } from "~applications";
import Application from "~applications/application";

/**
 * App disconnected listener. Sends a message
 * to trigger the disconnected event.
 */
export async function handleAuthStateChange({
  oldValue,
  newValue
}: StorageChange<string[]>) {
  // update icon
  const activeTab = await getActiveTab();
  const app = new Application(getAppURL(activeTab.url));
  const connected = await app.isConnected();

  await updateIcon(connected);
}
