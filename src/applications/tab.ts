import browser from "webextension-polyfill";

/**
 * Get a browser tab by id
 *
 * @param id ID of the tab to get
 */
export async function getTab(id: number) {
  // get all tabs
  const tabs = await browser.tabs.query({});

  return tabs.find((tab) => tab.id === id);
}

/**
 * Run code for each tab
 */
export async function forEachTab(
  fn: (tab: browser.Tabs.Tab) => void | Promise<void>
) {
  // get all tabs
  const tabs = await browser.tabs.query({});

  // go through all tabs
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;

    await fn(tab);
  }
}
