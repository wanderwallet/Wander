import type { Runtime } from "webextension-polyfill";

export const runtime = {
  // This should address lines like this:
  // browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });
  getURL: (path: string) => {
    return new URL(path, document.location.origin).toString();
  },

  getManifest: () => {
    return {
      name: "Wander Connect",
      version: "1.0.0",
      manifest_version: 3,
      browser_action: {
        default_popup: "popup.html"
      }
    };
  },

  onInstalled: {
    addListener: (fn) => {
      fn({
        reason: "install",
        temporary: false
      } satisfies Runtime.OnInstalledDetailsType);
    }
  }
};
