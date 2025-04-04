import { EMBEDDED_ANCESTOR_TAB_ID } from "~utils/embedded/embedded.constants";
import { getEmbeddedAncestorOrigin } from "~utils/embedded/embedded.utils";
import { isExternalURL } from "~utils/urls/isExternalURL";

export const tabs = {
  create: async ({ url }) => {
    if (process.env.NODE_ENV === "development")
      console.log(`tabs.create({ ${url} })`);

    const externalUrl = isExternalURL(url);

    // URL =
    // browser.runtime.getURL("tabs/welcome.html")
    // browser.runtime.getURL("tabs/dashboard.html#/contacts")
    // browser.runtime.getURL("assets/animation/arweave.png");
    // browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(...)}
    // `tabs/dashboard.html#/apps/${activeApp.url}`

    if (externalUrl) {
      window.open(url, "_blank");
    } else if (url === "tabs/welcome.html") {
      throw new Error("Welcome routes not added to Wander Embedded");
    } else if (url.startsWith("tabs/dashboard.html#")) {
      throw new Error("Dashboard not added to Wander Embedded");
    } else if (url.startsWith("tabs/auth.html")) {
      console.warn("Opening a `tabs/auth.html` tab prevented.");
    } else if (url.startsWith("assets")) {
      throw new Error(`Cannot create tab for URL = ${url}`);
    } else {
      throw new Error(`Cannot create tab for URL = ${url}`);
    }
  },

  get: async () => {
    return null;
  },

  query: async () => {
    return [
      {
        id: EMBEDDED_ANCESTOR_TAB_ID,
        url: getEmbeddedAncestorOrigin()
      }
    ]; // satisfies browser.Tabs.Tab
  },

  onConnect: {
    addListener: () => {},
    removeListener: () => {}
  },

  onUpdated: {
    addListener: () => {},
    removeListener: () => {}
  }
};
