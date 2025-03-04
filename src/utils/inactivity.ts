import browser from "webextension-polyfill";
import { ExtensionStorage } from "./storage";
import { getDecryptionKey, removeDecryptionKey } from "~wallets/auth";
import { IS_EMBEDDED_APP } from "./embedded/embedded.constants";
import { log, LOG_GROUP } from "./log/log.utils";

const INACTIVITY_ALARM_KEY = "inactivity_alarm";
const PORT_NAME = "popup-port";

let activePort: browser.Runtime.Port | null = null;

function handlePopupOpened() {
  log(LOG_GROUP.AUTH, "Popup opened");
  // Clear any existing inactivity alarm when popup opens
  browser.alarms.clear(INACTIVITY_ALARM_KEY);
}

async function handlePopupClosed() {
  log(LOG_GROUP.AUTH, "Popup closed");

  // check if there is a decryption key
  const decryptionKey = await getDecryptionKey();
  if (!decryptionKey) return;

  // Check if auto sign-out is enabled
  const isEnabled = await ExtensionStorage.get<boolean>(
    "auto_sign_out_enabled"
  );
  if (!isEnabled) return;

  // Get timeout value in minutes
  const timeout =
    (await ExtensionStorage.get<number>("auto_sign_out_time")) || 15;

  // Create alarm to sign out after timeout
  browser.alarms.create(INACTIVITY_ALARM_KEY, { delayInMinutes: timeout });

  log(
    LOG_GROUP.AUTH,
    `Inactivity timer started. Signing out in ${timeout} minutes`
  );
}

export function initInactivityTracking() {
  // Listen for popup port connections
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;

    handlePopupOpened();

    port.onDisconnect.addListener(() => {
      activePort = null;
      handlePopupClosed();
    });
  });

  // Listen for api popup creation events
  browser.windows.onCreated.addListener(async () => {
    // Get all popup windows
    const windows = await browser.windows.getAll({
      windowTypes: ["popup", "panel"]
    });

    // Check if our popup is open
    const popupIsOpen = windows.length > 0;
    if (!popupIsOpen) return;

    handlePopupOpened();
  });

  // Listen for popup window removal events
  browser.windows.onRemoved.addListener(async () => {
    // Get all popup windows
    const windows = await browser.windows.getAll({
      windowTypes: ["popup", "panel"]
    });

    // Check if our popup is open
    const popupIsOpen = windows.length > 0;
    console.log(popupIsOpen, activePort);
    if (popupIsOpen || activePort) return;

    handlePopupClosed();
  });

  // Handle decryption key removal
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === INACTIVITY_ALARM_KEY) {
      // check if there is a decryption key
      const decryptionKey = await getDecryptionKey();
      if (!decryptionKey) return;

      log(LOG_GROUP.AUTH, "Signing out due to inactivity");
      await removeDecryptionKey();
    }
  });
}

export function initPopupPort() {
  if (IS_EMBEDDED_APP) return () => {};

  // create a named connection to the background script for inactivity tracking
  activePort = browser.runtime.connect({ name: PORT_NAME });

  // Clean up when component unmounts
  return () => {
    activePort?.disconnect();
    activePort = null;
  };
}
