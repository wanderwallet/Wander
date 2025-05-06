import { action } from "~iframe/browser/action/action.mock";
import { alarms } from "~iframe/browser/alarms/alarms.mock";
import { i18n } from "~iframe/browser/i18n/i18n.mock";
import { runtime } from "~iframe/browser/runtime/runtime.mock";
import { storage } from "~iframe/browser/storage/storage.mock";
import { tabs } from "~iframe/browser/tabs/tabs.mock";
import { windows } from "~iframe/browser/windows/windows.mock";

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
