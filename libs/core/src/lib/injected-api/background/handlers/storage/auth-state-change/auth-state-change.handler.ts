import { Application } from "../../../../../applications/application.class";
import { getActiveTab } from "../../../../../applications/application.utils";
import { createContextMenus } from "../../../../../utils/browser-extension/context-menus";
import { updateIcon } from "../../../../../utils/browser-extension/icon";
import { StorageChange } from "../../../../../utils/browser-extension/runtime";
import { getAppURL } from "../../../../../utils/format/format";

/**
 * App disconnected listener. Sends a message
 * to trigger the disconnected event.
 */
export async function handleAuthStateChange({ oldValue, newValue }: StorageChange<string[]>) {
  // update icon
  const activeTab = await getActiveTab();
  const app = new Application(getAppURL(activeTab.url));
  const connected = await app.isConnected();

  await updateIcon(connected);
  createContextMenus(connected);
}
