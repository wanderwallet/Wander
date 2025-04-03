import { getActiveAddress, setActiveWallet, type StoredWallet } from "~wallets";
import type { StorageChange } from "~utils/runtime";
import Application from "~applications/application";
import { forEachTab } from "~applications/tab";
import { getAppURL } from "~utils/format";
import browser from "webextension-polyfill";
import { isomorphicSendMessage } from "~isomorphic-messaging";

/**
 * Added wallets change listener.
 * Fixup active address in case the current
 * active address' wallet has been removed.
 */
export async function handleWalletsChange({
  newValue,
  oldValue
}: StorageChange<StoredWallet[]>) {
  const wallets = newValue;
  const previousWallets = oldValue || [];

  // addresses
  const addresses = wallets.map((w) => w.address);

  // emit wallet change event
  await forEachTab(async (tab) => {
    const app = new Application(getAppURL(tab.url));

    // check required permissions
    const permissionCheck = await app.hasPermissions(["ACCESS_ALL_ADDRESSES"]);

    // app not connected
    if (permissionCheck.has.length === 0) return;

    // trigger emiter
    await isomorphicSendMessage({
      destination: `content-script@${tab.id}`,
      messageId: "event",
      data: {
        name: "addresses",
        value: permissionCheck.result ? addresses : null
      }
    });
  });

  // add or remove ANS label change listener
  if (wallets.length > 0 && previousWallets.length === 0) {
    // add scheduled label refresh if
    // Wander has just been set up
    browser.alarms.create("sync_labels", {
      delayInMinutes: 1,
      periodInMinutes: 60
    });
  } else if (wallets.length === 0 && previousWallets.length > 0) {
    // remove scheduled label refresh if
    // Wander has just been reset
    await browser.alarms.clear("sync_labels");
  }

  // remove if there are no wallets added
  if (!wallets || wallets.length === 0) {
    return await setActiveWallet(undefined);
  }

  // get current address
  const activeAddress = await getActiveAddress();

  // check if the active wallet has been removed
  if (!wallets.find((w) => w.address === activeAddress)) {
    // update active wallet
    return setActiveWallet(wallets[0].address);
  }
}
