import { EMBEDDED_IFRAME_TAB_ID } from "~utils/embedded/embedded.constants";

export const windows = {
  create: async ({ url }) => {
    // URL =
    // browser.runtime.getURL("tabs/welcome.html")
    // browser.runtime.getURL("tabs/dashboard.html#/contacts")
    // browser.runtime.getURL("assets/animation/arweave.png");
    // browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(...)}
    // `tabs/dashboard.html#/apps/${activeApp.url}`

    if (url.includes("tabs/welcome.html")) {
      throw new Error("Welcome routes not added to Wander Embedded");
    } else if (url.includes("tabs/dashboard.html#")) {
      throw new Error("Dashboard not added to Wander Embedded");
    } else if (url.includes("tabs/auth.html")) {
      console.warn("Opening a `tabs/auth.html` window prevented.");
    } else if (url.includes("assets")) {
      throw new Error(`Cannot create tab for URL = ${url}`);
    } else {
      throw new Error(`Cannot create tab for URL = ${url}`);
    }

    return {
      tabs: [
        {
          id: EMBEDDED_IFRAME_TAB_ID
        }
      ]
    };
  }
};
