import { ExtensionStorage } from "~utils/storage";
import type { StoredWallet } from "./wallets.types";
import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { resetStorage } from "~utils/storage.utils";

/**
 * Get wallets from storage
 *
 * @returns Wallets in storage
 */
export async function getWallets() {
  let wallets: StoredWallet[] = await ExtensionStorage.get("wallets");

  return wallets || [];
}

/**
 * Get the active address
 */
export async function getActiveAddress() {
  const activeAddress = await ExtensionStorage.get("active_address");

  return activeAddress;
}

export async function openOrSelectWelcomePage(force = false) {
  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
    log(LOG_GROUP.AUTH, `PREVENTED openOrSelectWelcomePage(${force})`);

    return;
  }

  // ONLY BROWSER EXTENSION BELOW THIS LINE:

  log(LOG_GROUP.AUTH, `openOrSelectWelcomePage(${force})`);

  // Make sure we clear any stored value from previous installations before
  // opening the welcome page to onboard the user:
  // Skip reset for test environment
  const manifest = browser.runtime.getManifest();
  if (manifest["__TEST_MODE__"] !== true) {
    await resetStorage();
  }

  const url = browser.runtime.getURL("tabs/welcome.html");
  const welcomePageTabs = await browser.tabs.query({ url });
  const welcomePageTabID = welcomePageTabs[0]?.id;

  if (welcomePageTabID) {
    if (force) {
      // More aggressive version, just select the existing tab:
      browser.tabs.update(welcomePageTabID, { active: true });
    } else {
      // Less aggressive version, just highlight the existing tab but do not select it:
      browser.tabs.highlight({ tabs: welcomePageTabID });
    }
  } else {
    browser.tabs.create({ url });
  }
}
