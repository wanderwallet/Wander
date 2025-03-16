import browser from "webextension-polyfill";
import { ExtensionStorage } from "../storage";
import { getDecryptionKey, removeDecryptionKey } from "~wallets/auth";
import { log, LOG_GROUP } from "../log/log.utils";
import { INACTIVITY } from "./inactivity.constants";
import throttle from "lodash.throttle";
import type { AutoLockSettings } from "./inactivity.types";
import type { StorageChange } from "~utils/runtime";

export class InactivityManager {
  private lastActivityCheckTime = 0;
  private settingsCache: AutoLockSettings | null = null;

  private async getSettings(): Promise<AutoLockSettings> {
    if (this.settingsCache) return this.settingsCache;

    const settings = (await ExtensionStorage.get<AutoLockSettings>(
      INACTIVITY.STORAGE.AUTO_LOCK
    )) ?? { enabled: false, timeout: INACTIVITY.DEFAULT_TIMEOUT_MINUTES };

    this.settingsCache = settings;

    return settings;
  }

  private async isEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.enabled;
  }

  private async getTimeout(): Promise<number> {
    const settings = await this.getSettings();
    return settings.timeout;
  }

  private async clearAllInactivityAlarms(): Promise<void> {
    try {
      await Promise.all([
        browser.alarms.clear(INACTIVITY.ALARM.TIMER),
        browser.alarms.clear(INACTIVITY.ALARM.CHECK)
      ]);
      log(LOG_GROUP.SESSION, "Cleared all inactivity alarms");
    } catch (error) {
      log(LOG_GROUP.SESSION, `Failed to clear alarms: ${error.message}`);
    }
  }

  private setupPeriodicCheck(enabled: boolean): void {
    if (enabled) {
      browser.alarms.create(INACTIVITY.ALARM.CHECK, { periodInMinutes: 1 });
      log(LOG_GROUP.SESSION, "Created periodic check alarm");
    } else {
      this.clearAllInactivityAlarms();
    }
  }

  private async handleSettingsChange(
    newValue: AutoLockSettings
  ): Promise<void> {
    this.settingsCache = newValue;
    this.setupPeriodicCheck(newValue.enabled);

    if (newValue.enabled) {
      await this.checkAndHandleSessionState();
    }
  }

  private async clearInactivityAlarm(): Promise<void> {
    try {
      await browser.alarms.clear(INACTIVITY.ALARM.TIMER);
    } catch (error) {
      log(LOG_GROUP.SESSION, `Failed to clear alarm: ${error.message}`);
    }
  }

  private async startInactivityTimer(timeout: number): Promise<void> {
    if (timeout <= 0) {
      await this.handleAutoSignOut();
      return;
    }

    try {
      browser.alarms.create(INACTIVITY.ALARM.TIMER, {
        delayInMinutes: timeout
      });
      log(LOG_GROUP.SESSION, `Auto-lock in ${timeout}min`);
    } catch (error) {
      log(LOG_GROUP.SESSION, `Failed to start timer: ${error.message}`);
    }
  }

  private isPopupWindow = (window: browser.Windows.Window): boolean => {
    if (!window.width || !window.height || !window.focused) return false;

    return (
      Math.abs(window.width - INACTIVITY.POPUP.WIDTH) <=
        INACTIVITY.POPUP.SIZE_TOLERANCE &&
      Math.abs(window.height - INACTIVITY.POPUP.HEIGHT) <=
        INACTIVITY.POPUP.SIZE_TOLERANCE
    );
  };

  private async handleInactivityCheck(): Promise<void> {
    const now = Date.now();

    // Throttle checks to once per second
    if (now - this.lastActivityCheckTime < 1000) {
      return;
    }
    this.lastActivityCheckTime = now;

    const [lastActivity, timeout] = await Promise.all([
      ExtensionStorage.get<number>(INACTIVITY.STORAGE.LAST_ACTIVITY),
      this.getTimeout()
    ]);

    const timeoutMs = timeout * 60 * 1000;

    if (lastActivity && now - lastActivity < timeoutMs) {
      log(LOG_GROUP.SESSION, "Recent activity detected, skipping check");
      return;
    }

    const decryptionKey = await getDecryptionKey();
    if (!decryptionKey) {
      log(LOG_GROUP.SESSION, "Not logged in");
      return;
    }

    const inactiveTime = lastActivity ? (now - lastActivity) / 60000 : 0;
    const finalTimeout = Math.max(0, Math.min(timeout, timeout - inactiveTime));
    await this.startInactivityTimer(finalTimeout);
  }

  public recordActivity = throttle(
    async () => {
      if (!(await this.isEnabled())) return;

      try {
        log(LOG_GROUP.SESSION, "Recording activity");
        await Promise.all([
          ExtensionStorage.set(INACTIVITY.STORAGE.LAST_ACTIVITY, Date.now()),
          this.clearInactivityAlarm()
        ]);
      } catch (error) {
        log(LOG_GROUP.SESSION, `Failed to record activity: ${error.message}`);
      }
    },
    INACTIVITY.THROTTLE_TIME,
    { leading: true, trailing: false }
  );

  async checkAndHandleSessionState(
    popupWindow: boolean = false
  ): Promise<void> {
    try {
      if (!(await this.isEnabled())) {
        log(LOG_GROUP.SESSION, "Auto-lock disabled");
        return;
      }

      if (popupWindow) {
        const windows = await browser.windows.getAll({
          windowTypes: ["popup", "panel"]
        });

        if (windows.some(this.isPopupWindow)) {
          await this.recordActivity();
          return;
        }
      }

      await this.handleInactivityCheck();
    } catch (error) {
      log(LOG_GROUP.SESSION, `Session check failed: ${error.message}`);
      await this.clearInactivityAlarm();
    }
  }

  private async handleAutoSignOut(alarm?: browser.Alarms.Alarm): Promise<void> {
    if (alarm && alarm.name !== INACTIVITY.ALARM.TIMER) return;

    try {
      const decryptionKey = await getDecryptionKey();
      if (!decryptionKey) return;

      const [lastActivity, timeout] = await Promise.all([
        ExtensionStorage.get<number>(INACTIVITY.STORAGE.LAST_ACTIVITY),
        this.getTimeout()
      ]);

      const now = Date.now();
      if (lastActivity && now - lastActivity < timeout * 60 * 1000) return;

      log(LOG_GROUP.SESSION, "Auto-locked due to inactivity");
      await removeDecryptionKey();
    } catch (error) {
      log(LOG_GROUP.SESSION, `Auto-lock failed: ${error.message}`);
      await this.clearInactivityAlarm();
    }
  }

  public initialize(): void {
    this.checkAndHandleSessionState().catch((error) => {
      log(LOG_GROUP.SESSION, `Init failed: ${error.message}`);
    });

    // Watch for settings changes
    ExtensionStorage.watch({
      [INACTIVITY.STORAGE.AUTO_LOCK]: ({
        newValue
      }: StorageChange<AutoLockSettings>) => {
        this.handleSettingsChange(newValue);
      }
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    // Window listeners
    browser.windows.onCreated.addListener((window) => {
      if (window.type === "popup" || window.type === "panel") {
        this.checkAndHandleSessionState(true);
      }
    });
    browser.windows.onRemoved.addListener(() =>
      this.checkAndHandleSessionState(true)
    );

    // Alarm listeners
    browser.alarms.onAlarm.addListener(async (alarm) => {
      if (!(await this.isEnabled())) {
        return;
      }

      if (alarm.name === INACTIVITY.ALARM.TIMER) {
        await this.handleAutoSignOut(alarm);
      } else if (alarm.name === INACTIVITY.ALARM.CHECK) {
        await this.checkAndHandleSessionState();
      }
    });

    // Setup initial periodic check based on current settings
    this.isEnabled().then((enabled) => {
      this.setupPeriodicCheck(enabled);
    });
  }
}

export const inactivityManager = new InactivityManager();
