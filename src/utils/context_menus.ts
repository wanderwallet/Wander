import browser, { type Menus, type Tabs } from "webextension-polyfill";
import { getActiveAddress, getWallets } from "~wallets";
import { getActiveTab, removeApp } from "~applications";
import { isManifestv3 } from "./runtime";
import { getAppURL } from "./format";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";

/**
 * Create context menus (right click actions)
 *
 * @param hasPerms Does the active site have any permissions?
 */
export async function createContextMenus(hasPerms: boolean) {
  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
    return;
  }

  await browser.contextMenus.removeAll();

  // remove previous event listener
  if (isManifestv3()) {
    browser.contextMenus.onClicked.removeListener(contextClickListener);
  }

  // if any wallets are added, create
  // a "copy current address" context menu
  const wallets = await getWallets();
  const actionContext = isManifestv3() ? "action" : "browser_action";

  if (wallets.length > 0) {
    browser.contextMenus.create(
      {
        id: "copy_address_context_menu",
        title: "Copy current address",
        contexts: [actionContext],
        onclick: !isManifestv3() ? onCopyAddressClicked : undefined
      },
      () => browser.runtime.lastError
    );
  }

  // if the site has any perms,
  // display the disconnect
  // context menu
  if (hasPerms) {
    browser.contextMenus.create(
      {
        id: "disconnect_context_menu",
        title: "Disconnect from current site",
        contexts: [actionContext, "page"],
        onclick: !isManifestv3()
          ? (_, tab) => onDisconnectClicked(tab)
          : undefined
      },
      () => browser.runtime.lastError
    );
  }

  // if we are one manifest v3, we add an event
  // listener for context menu clicks
  if (isManifestv3() && (hasPerms || wallets.length > 0)) {
    browser.contextMenus.onClicked.addListener(contextClickListener);
  }
}

/**
 * Handle context menu click event for manifest v3
 */
async function contextClickListener(info: Menus.OnClickData, tab: Tabs.Tab) {
  try {
    switch (info.menuItemId) {
      case "disconnect_context_menu":
        await onDisconnectClicked(tab);
        break;

      case "copy_address_context_menu":
        await onCopyAddressClicked();
        break;
    }
  } catch {}
}

/**
 * Handle copy address click
 */
async function onCopyAddressClicked() {
  const activeAddress = await getActiveAddress();

  if (!activeAddress || activeAddress === "") return;

  const activeTab = await getActiveTab();

  // This will never be used for the embedded wallet anyway:
  await isomorphicSendMessage({
    destination: `content-script@${activeTab.id}`,
    messageId: "copy_address",
    data: activeAddress
  });
}

/**
 * Handle disconnect context menu click
 */
async function onDisconnectClicked(tab: Tabs.Tab) {
  if (!tab.url) return;

  // remove the app and reload the tab
  await removeApp(getAppURL(tab.url));
  await browser.tabs.reload(tab.id);
}
