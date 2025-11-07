import browser from "webextension-polyfill";

/**
 * Close the current tab
 */
export const closeCurrentTab = async () => {
  try {
    const currentWindow = await browser.tabs.getCurrent();
    await browser.tabs.remove(currentWindow.id);
  } catch {
    window.top.close();
  }
};
