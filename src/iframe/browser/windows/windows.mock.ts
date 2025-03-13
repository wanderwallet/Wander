export const windows = {
  create: async ({ url }) => {
    debugger;

    if (process.env.NODE_ENV === "development")
      console.log(`tabs.create({ ${url} })`);

    // URL =
    // browser.runtime.getURL("tabs/welcome.html")
    // browser.runtime.getURL("tabs/dashboard.html#/contacts")
    // browser.runtime.getURL("assets/animation/arweave.png");
    // browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(...)}
    // `tabs/dashboard.html#/apps/${activeApp.url}`

    if (url.includes("tabs/welcome.html")) {
      throw new Error("Welcome routes not added to ArConnect Embedded");

      // location.hash = "/welcome";
    } else if (url.includes("tabs/dashboard.html#")) {
      throw new Error("Dashboard not added to ArConnect Embedded");

      // const hash = url.split("#").pop();
      // location.hash = `/quick-settings${hash}`;
    } else if (url.includes("tabs/auth.html")) {
      console.warn("Trying to open `tabs/auth.html`");

      // const paramsAndHash = url.split("tabs/auth.html")[1];
      // location.hash = `/auth-requests${paramsAndHash}`;

      location.hash = `/auth-requests`;
    } else if (url.includes("assets")) {
      throw new Error(`Cannot create tab for URL = ${url}`);
    } else {
      throw new Error(`Cannot create tab for URL = ${url}`);
    }
  }
};
