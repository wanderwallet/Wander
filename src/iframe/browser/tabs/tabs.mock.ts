import { EMBEDDED_PARENT_ORIGIN } from "~utils/embedded/sdk/utils/url/sdk-url.utils";

export const tabs = {
  create: async ({ url }) => {
    if (process.env.NODE_ENV === "development")
      console.log(`tabs.create({ ${url} })`);

    // URL =
    // browser.runtime.getURL("tabs/welcome.html")
    // browser.runtime.getURL("tabs/dashboard.html#/contacts")
    // browser.runtime.getURL("assets/animation/arweave.png");
    // browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(...)}
    // `tabs/dashboard.html#/apps/${activeApp.url}`

    if (url === "tabs/welcome.html") {
      throw new Error("Welcome routes not added to ArConnect Embedded");

      // location.hash = "/welcome";
    } else if (url.startsWith("tabs/dashboard.html#")) {
      throw new Error("Dashboard not added to ArConnect Embedded");

      // const hash = url.split("#").pop();
      // location.hash = `/quick-settings${hash}`;
    } else if (url.startsWith("tabs/auth.html")) {
      console.warn("Trying to open `tabs/auth.html`");

      const paramsAndHash = url.replace("tabs/auth.html", "");
      location.hash = `/auth${paramsAndHash}`;
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
        id: 0,
        url: EMBEDDED_PARENT_ORIGIN
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
