import Application, { type InitAppParams, PREFIX } from "./application";
import { ExtensionStorage, PersistentStorage } from "~utils/storage";
import browser from "webextension-polyfill";

/**
 * Get all connected app keys
 */
export async function getStoredApps(): Promise<string[]> {
  return (await PersistentStorage.get("apps")) || [];
}

/**
 * Get all applications connected
 */
export async function getApps() {
  // fetch app urls
  const appUrls = await getStoredApps();
  const apps: Application[] = [];

  // init all apps
  for (const url of appUrls) {
    apps.push(new Application(url));
  }

  return apps;
}

/**
 * Add an application
 */
export async function addApp({ url, ...rest }: InitAppParams) {
  if (url === "") return;

  const storedApps = await getStoredApps();

  // check if app is already added
  if (storedApps.includes(url)) return;

  // add app url
  await PersistentStorage.set("apps", [...storedApps, url]);

  // save app settings
  await PersistentStorage.set(`${PREFIX}${url}`, {
    url,
    ...rest
  });
}

/**
 * Remove an application (disconnect)
 *
 * @param url URL of the tab to remove
 */
export async function removeApp(url: string) {
  const storedApps = await getStoredApps();

  // remove app key
  await PersistentStorage.set(
    "apps",
    storedApps.filter((val) => val !== url)
  );

  // remove app settings
  await PersistentStorage.remove(`${PREFIX}${url}`);
}

/**
 * Get the active tab object
 */
export const getActiveTab = async () =>
  (
    await browser.tabs.query({
      active: true,
      currentWindow: true
    })
  )[0];
