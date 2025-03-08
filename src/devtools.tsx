import browser from "webextension-polyfill";

browser.devtools.panels.create(
  "Wander",
  browser.runtime.getManifest().icons["128"],
  "tabs/devtools.html"
);

browser.devtools.panels.create(
  "ArLocal",
  browser.runtime.getManifest().icons["128"],
  "tabs/arlocal.html"
);

const Placeholder = () => <></>;
export default Placeholder;
