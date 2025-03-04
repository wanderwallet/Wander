import browser from "webextension-polyfill";
import { ExtensionStorage } from "./storage";
import { getDecryptionKey, removeDecryptionKey } from "~wallets/auth";
import { IS_EMBEDDED_APP } from "./embedded/embedded.constants";
import { log, LOG_GROUP } from "./log/log.utils";

const INACTIVITY_ALARM_KEY = "inactivity_alarm";
const PORT_NAME = "popup-port";

// Track both popups and ports
let activePopups = 0;
let activePortConnections = 0;

async function checkAndHandleExtensionState() {
  const isOpen = activePopups > 0 || activePortConnections > 0;
  log(LOG_GROUP.AUTH, `Extension state check - ${isOpen ? "open" : "closed"}`);

  if (isOpen) {
    await browser.alarms.clear(INACTIVITY_ALARM_KEY);
    return;
  }

  // No popups or ports active, start inactivity timer
  const decryptionKey = await getDecryptionKey();
  if (!decryptionKey) return;

  const isEnabled = await ExtensionStorage.get<boolean>(
    "auto_sign_out_enabled"
  );
  if (!isEnabled) return;

  const timeout =
    (await ExtensionStorage.get<number>("auto_sign_out_time")) || 15;
  browser.alarms.create(INACTIVITY_ALARM_KEY, { delayInMinutes: timeout });

  log(
    LOG_GROUP.AUTH,
    `Inactivity timer started. Signing out in ${timeout} minutes`
  );
}

export function initInactivityTracking() {
  // Initialize popup count
  browser.windows
    .getAll({ windowTypes: ["popup", "panel"] })
    .then((windows) => {
      activePopups = windows.length;
      log(LOG_GROUP.AUTH, `Initial popups: ${activePopups}`);
      checkAndHandleExtensionState();
    })
    .catch(() => {});

  // Track port connections
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;

    activePortConnections++;
    log(
      LOG_GROUP.AUTH,
      `Port connected. Active ports: ${activePortConnections}`
    );
    checkAndHandleExtensionState();

    port.onDisconnect.addListener(() => {
      activePortConnections--;
      if (activePortConnections < 0) activePortConnections = 0;
      log(
        LOG_GROUP.AUTH,
        `Port disconnected. Active ports: ${activePortConnections}`
      );
      checkAndHandleExtensionState();
    });
  });

  // Track window events
  browser.windows.onCreated.addListener((window) => {
    if (window.type === "popup" || window.type === "panel") {
      activePopups++;
      log(LOG_GROUP.AUTH, `Popup created. Active popups: ${activePopups}`);
      checkAndHandleExtensionState();
    }
  });

  browser.windows.onRemoved.addListener(() => {
    // Verify actual window count after removal
    browser.windows
      .getAll({ windowTypes: ["popup", "panel"] })
      .then((windows) => {
        activePopups = windows.length;
        log(LOG_GROUP.AUTH, `Popup removed. Active popups: ${activePopups}`);
        checkAndHandleExtensionState();
      })
      .catch(() => {});
  });

  // Handle auto sign-out
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === INACTIVITY_ALARM_KEY) {
      // Double check state before signing out
      if (activePopups === 0 && activePortConnections === 0) {
        const decryptionKey = await getDecryptionKey();
        if (!decryptionKey) return;

        log(LOG_GROUP.AUTH, "Signing out due to inactivity");
        await removeDecryptionKey();
      } else {
        // Cancel alarm if extension is actually still open
        await browser.alarms.clear(INACTIVITY_ALARM_KEY);
      }
    }
  });
}

export function initPopupPort() {
  if (IS_EMBEDDED_APP) return () => {};

  const port = browser.runtime.connect({ name: PORT_NAME });
  return () => port.disconnect();
}
