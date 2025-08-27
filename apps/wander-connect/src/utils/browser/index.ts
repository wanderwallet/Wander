import { action } from "./action/action.mock";
import { alarms } from "./alarms/alarms.mock";
import { i18n } from "./i18n/i18n.mock";
import { runtime } from "./runtime/runtime.mock";
import { storage } from "./storage/storage.mock";
import { tabs } from "./tabs/tabs.mock";
import { windows } from "./windows/windows.mock";

// To add new mocks, just export them here. They are imported by `vite.config.js`:
// > "webextension-polyfill": path.resolve(__dirname, "./src/iframe/browser")

export default {
  action,
  alarms,
  i18n,
  runtime,
  storage,
  tabs,
  windows,
};
