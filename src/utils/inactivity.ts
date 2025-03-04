import browser from "webextension-polyfill";
import { ExtensionStorage } from "./storage";
import { getDecryptionKey, removeDecryptionKey } from "~wallets/auth";
import { IS_EMBEDDED_APP } from "./embedded/embedded.constants";
import { log, LOG_GROUP } from "./log/log.utils";

const INACTIVITY_ALARM_KEY = "inactivity_alarm";
const PORT_NAME = "popup-port";

// Internal tracking for extension state
let activePopups = 0;
let activePortConnections = 0;

function getSessionCount() {
  return activePopups + activePortConnections;
}

function isExtensionActive() {
  return getSessionCount() > 0;
}

function getSessionStatus() {
  const count = getSessionCount();
  return `Session: Active (${count})`;
}

async function checkAndHandleSessionState() {
  const isActive = isExtensionActive();

  if (isActive) {
    await browser.alarms.clear(INACTIVITY_ALARM_KEY);
    return;
  }

  const decryptionKey = await getDecryptionKey();
  if (!decryptionKey) {
    log(LOG_GROUP.SESSION, "Not logged in");
    return;
  }

  const isEnabled = await ExtensionStorage.get<boolean>(
    "auto_sign_out_enabled"
  );
  if (!isEnabled) {
    log(LOG_GROUP.SESSION, "Auto-lock disabled");
    return;
  }

  const timeout =
    (await ExtensionStorage.get<number>("auto_sign_out_time")) || 15;
  browser.alarms.create(INACTIVITY_ALARM_KEY, { delayInMinutes: timeout });
  log(LOG_GROUP.SESSION, `Auto-lock in ${timeout}min`);
}

export function initInactivityTracking() {
  // Initialize session state
  browser.windows
    .getAll({ windowTypes: ["popup", "panel"] })
    .then((windows) => {
      activePopups = windows.length;
      log(LOG_GROUP.SESSION, `Initialized ${getSessionStatus()}`);
      checkAndHandleSessionState();
    })
    .catch((error) => {
      log(LOG_GROUP.SESSION, `Init failed: ${error.message}`);
    });

  // Track session activity via ports
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;

    activePortConnections++;
    log(LOG_GROUP.SESSION, `Connected ${getSessionStatus()}`);
    checkAndHandleSessionState();

    port.onDisconnect.addListener(() => {
      activePortConnections = Math.max(0, activePortConnections - 1);
      log(LOG_GROUP.SESSION, `Disconnected ${getSessionStatus()}`);
      checkAndHandleSessionState();
    });
  });

  // Track session windows
  browser.windows.onCreated.addListener((window) => {
    if (window.type === "popup" || window.type === "panel") {
      activePopups++;
      log(LOG_GROUP.SESSION, `Connected ${getSessionStatus()}`);
      checkAndHandleSessionState();
    }
  });

  browser.windows.onRemoved.addListener(() => {
    browser.windows
      .getAll({ windowTypes: ["popup", "panel"] })
      .then((windows) => {
        activePopups = windows.length;
        log(LOG_GROUP.SESSION, `Disconnected ${getSessionStatus()}`);
        checkAndHandleSessionState();
      })
      .catch((error) => {
        log(LOG_GROUP.SESSION, `Window check failed: ${error.message}`);
      });
  });

  // Handle session timeout
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === INACTIVITY_ALARM_KEY) {
      if (!isExtensionActive()) {
        const decryptionKey = await getDecryptionKey();
        if (!decryptionKey) {
          log(LOG_GROUP.SESSION, "Already locked");
          return;
        }

        log(LOG_GROUP.SESSION, "Auto-locked due to inactivity");
        await removeDecryptionKey();
      } else {
        log(LOG_GROUP.SESSION, `Lock cancelled - ${getSessionStatus()}`);
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
