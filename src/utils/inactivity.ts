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

// Exact extension popup dimensions
const POPUP_WIDTH = 385;
const POPUP_HEIGHT = 720;

// Allow small variance in size
const SIZE_TOLERANCE = 20;

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

async function clearInactivityAlarm() {
  try {
    await browser.alarms.clear(INACTIVITY_ALARM_KEY);
  } catch (error) {
    log(LOG_GROUP.SESSION, `Failed to clear alarm: ${error.message}`);
  }
}

async function startInactivityTimer(timeout: number) {
  try {
    browser.alarms.create(INACTIVITY_ALARM_KEY, { delayInMinutes: timeout });
    log(LOG_GROUP.SESSION, `Auto-lock in ${timeout}min`);
  } catch (error) {
    log(LOG_GROUP.SESSION, `Failed to start timer: ${error.message}`);
  }
}

async function checkAndHandleSessionState() {
  try {
    // Get all popup/panel windows
    const windows = await browser.windows.getAll({
      windowTypes: ["popup", "panel"]
    });

    // Filter for our specific extension popup size
    const extensionWindows = windows.filter((window) => {
      // Check if dimensions match our popup (with tolerance)
      const matchesWidth =
        window.width && Math.abs(window.width - POPUP_WIDTH) <= SIZE_TOLERANCE;
      const matchesHeight =
        window.height &&
        Math.abs(window.height - POPUP_HEIGHT) <= SIZE_TOLERANCE;

      return matchesWidth && matchesHeight;
    });

    activePopups = extensionWindows.length;
    const isActive = isExtensionActive();

    log(LOG_GROUP.SESSION, getSessionStatus());

    if (isActive) {
      await clearInactivityAlarm();
      return;
    }

    // Session is inactive, check if we should start timer
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
      (await ExtensionStorage.get<number>("auto_sign_out_time")) ?? 15;
    await startInactivityTimer(timeout);
  } catch (error) {
    log(LOG_GROUP.SESSION, `Session check failed: ${error.message}`);
    // Ensure we don't leave session in bad state
    await clearInactivityAlarm();
  }
}

export function initInactivityTracking() {
  // Initialize state
  checkAndHandleSessionState().catch((error) => {
    log(LOG_GROUP.SESSION, `Init failed: ${error.message}`);
  });

  // Track port connections
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;

    try {
      activePortConnections++;
      log(LOG_GROUP.SESSION, `Connected ${getSessionStatus()}`);
      checkAndHandleSessionState();

      port.onDisconnect.addListener(() => {
        activePortConnections = Math.max(0, activePortConnections - 1);
        checkAndHandleSessionState();
      });
    } catch (error) {
      log(LOG_GROUP.SESSION, `Port handling failed: ${error.message}`);
      checkAndHandleSessionState();
    }
  });

  // Track window events
  browser.windows.onCreated.addListener((window) => {
    if (window.type === "popup" || window.type === "panel") {
      checkAndHandleSessionState();
    }
  });

  browser.windows.onRemoved.addListener(() => {
    checkAndHandleSessionState();
  });

  // Handle auto sign-out
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== INACTIVITY_ALARM_KEY) return;

    try {
      // Double check real state before signing out
      await checkAndHandleSessionState();

      if (!isExtensionActive()) {
        const decryptionKey = await getDecryptionKey();
        if (!decryptionKey) {
          log(LOG_GROUP.SESSION, "Already locked");
          return;
        }

        log(LOG_GROUP.SESSION, "Auto-locked due to inactivity");
        await removeDecryptionKey();
      }
    } catch (error) {
      log(LOG_GROUP.SESSION, `Auto-lock failed: ${error.message}`);
      // Ensure we don't leave session in bad state
      await clearInactivityAlarm();
    }
  });
}

export function initPopupPort() {
  if (IS_EMBEDDED_APP) return () => {};

  try {
    const port = browser.runtime.connect({ name: PORT_NAME });
    return () => {
      try {
        port.disconnect();
      } catch (error) {
        log(LOG_GROUP.SESSION, `Port disconnect failed: ${error.message}`);
      }
    };
  } catch (error) {
    log(LOG_GROUP.SESSION, `Port connect failed: ${error.message}`);
    return () => {};
  }
}
