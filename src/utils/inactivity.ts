import browser from "webextension-polyfill";
import { ExtensionStorage } from "./storage";
import { getDecryptionKey, removeDecryptionKey } from "~wallets/auth";
import { log, LOG_GROUP } from "./log/log.utils";
import { useEffect } from "react";
import throttle from "lodash.throttle";

const INACTIVITY_ALARM_KEY = "inactivity_alarm";
const INACTIVITY_CHECK_ALARM_KEY = "inactivity_check";
const LAST_ACTIVITY_KEY = "last_activity_timestamp";

// Exact extension popup dimensions for window detection
const POPUP_WIDTH = 385;
const POPUP_HEIGHT = 720;
const SIZE_TOLERANCE = 20;

export const throttledRecordActivity = throttle(
  async () => {
    try {
      log(LOG_GROUP.SESSION, "Recording activity");
      await ExtensionStorage.set(LAST_ACTIVITY_KEY, Date.now());
      await clearInactivityAlarm();
    } catch (error) {
      log(LOG_GROUP.SESSION, `Failed to record activity: ${error.message}`);
    }
  },
  5000,
  { leading: true, trailing: false }
);

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

    // Check if we have an active extension window
    const hasActivePopup = windows.some((window) => {
      const matchesWidth =
        window.width && Math.abs(window.width - POPUP_WIDTH) <= SIZE_TOLERANCE;
      const matchesHeight =
        window.height &&
        Math.abs(window.height - POPUP_HEIGHT) <= SIZE_TOLERANCE;
      return matchesWidth && matchesHeight && window.focused;
    });

    // Record activity if popup is open
    if (hasActivePopup) {
      await throttledRecordActivity();
      return;
    }

    // Check for recent activity
    const lastActivity = await ExtensionStorage.get<number>(LAST_ACTIVITY_KEY);
    const now = Date.now();

    // Check auto-lock settings
    const isEnabled = await ExtensionStorage.get<boolean>(
      "auto_sign_out_enabled"
    );
    if (!isEnabled) {
      log(LOG_GROUP.SESSION, "Auto-lock disabled");
      return;
    }

    const timeout =
      (await ExtensionStorage.get<number>("auto_sign_out_time")) ?? 5;
    const timeoutMs = timeout * 60 * 1000;

    // If there was recent activity, don't start timer
    if (lastActivity && now - lastActivity < timeoutMs) {
      log(
        LOG_GROUP.SESSION,
        "Recent activity detected, skipping inactivity check"
      );
      return;
    }

    // Check if we're logged in
    const decryptionKey = await getDecryptionKey();
    if (!decryptionKey) {
      log(LOG_GROUP.SESSION, "Not logged in");
      return;
    }

    // Start inactivity timer
    const inactiveTime = lastActivity ? (now - lastActivity) / 60000 : 0;
    const finalTimeout = Math.max(0, Math.min(timeout, timeout - inactiveTime));
    await startInactivityTimer(finalTimeout);
  } catch (error) {
    log(LOG_GROUP.SESSION, `Session check failed: ${error.message}`);
    await clearInactivityAlarm();
  }
}

export function useActivityTracking() {
  useEffect(() => {
    // Single async setup function
    const setup = async () => {
      const events = ["click", "submit", "change"];

      // Early return if feature disabled
      const isEnabled = await ExtensionStorage.get<boolean>(
        "auto_sign_out_enabled"
      );
      if (!isEnabled) return;

      throttledRecordActivity();

      const handleActivity = () => {
        throttledRecordActivity();
      };

      events.forEach((event) => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      // Return cleanup function
      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleActivity);
        });
        throttledRecordActivity.cancel();
      };
    };

    // Setup and store cleanup
    let cleanup: (() => void) | undefined;
    setup().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup on unmount
    return () => {
      cleanup?.();
    };
  }, []);
}

export function initInactivityTracking() {
  // Initialize state
  checkAndHandleSessionState().catch((error) => {
    log(LOG_GROUP.SESSION, `Init failed: ${error.message}`);
  });

  // Track window events
  browser.windows.onCreated.addListener((window) => {
    if (window.type === "popup" || window.type === "panel") {
      checkAndHandleSessionState();
    }
  });

  browser.windows.onRemoved.addListener(checkAndHandleSessionState);

  // Handle auto sign-out
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== INACTIVITY_ALARM_KEY) return;

    try {
      const decryptionKey = await getDecryptionKey();
      if (!decryptionKey) return;

      const lastActivity = await ExtensionStorage.get<number>(
        LAST_ACTIVITY_KEY
      );
      const now = Date.now();
      const timeout =
        (await ExtensionStorage.get<number>("auto_sign_out_time")) ?? 5;

      if (lastActivity && now - lastActivity < timeout * 60 * 1000) return;

      log(LOG_GROUP.SESSION, "Auto-locked due to inactivity");
      await removeDecryptionKey();
    } catch (error) {
      log(LOG_GROUP.SESSION, `Auto-lock failed: ${error.message}`);
      await clearInactivityAlarm();
    }
  });

  // Periodic inactivity check
  browser.alarms.create(INACTIVITY_CHECK_ALARM_KEY, { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === INACTIVITY_CHECK_ALARM_KEY) {
      checkAndHandleSessionState();
    }
  });
}
