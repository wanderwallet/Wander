import browser from "webextension-polyfill";
import { ExtensionStorage } from "../storage";
import { getDecryptionKey, removeDecryptionKey } from "~wallets/auth";
import { log, LOG_GROUP } from "../log/log.utils";
import { INACTIVITY } from "./inactivity.constants";
import throttle from "lodash.throttle";

export class InactivityManager {
  private async clearInactivityAlarm(): Promise<void> {
    try {
      await browser.alarms.clear(INACTIVITY.ALARM.TIMER);
    } catch (error) {
      log(LOG_GROUP.SESSION, `Failed to clear alarm: ${error.message}`);
    }
  }

  private async startInactivityTimer(timeout: number): Promise<void> {
    try {
      browser.alarms.create(INACTIVITY.ALARM.TIMER, {
        delayInMinutes: timeout
      });
      log(LOG_GROUP.SESSION, `Auto-lock in ${timeout}min`);
    } catch (error) {
      log(LOG_GROUP.SESSION, `Failed to start timer: ${error.message}`);
    }
  }

  private isPopupWindow(window: browser.Windows.Window): boolean {
    const matchesWidth =
      window.width &&
      Math.abs(window.width - INACTIVITY.POPUP.WIDTH) <=
        INACTIVITY.POPUP.SIZE_TOLERANCE;
    const matchesHeight =
      window.height &&
      Math.abs(window.height - INACTIVITY.POPUP.HEIGHT) <=
        INACTIVITY.POPUP.SIZE_TOLERANCE;
    return matchesWidth && matchesHeight && window.focused;
  }

  private async handleInactivityCheck(): Promise<void> {
    const lastActivity = await ExtensionStorage.get<number>(
      INACTIVITY.STORAGE.LAST_ACTIVITY
    );
    const now = Date.now();
    const timeout =
      (await ExtensionStorage.get<number>(
        INACTIVITY.STORAGE.AUTO_SIGN_OUT_TIME
      )) ?? INACTIVITY.DEFAULT_TIMEOUT_MINUTES;
    const timeoutMs = timeout * 60 * 1000;

    if (lastActivity && now - lastActivity < timeoutMs) {
      log(
        LOG_GROUP.SESSION,
        "Recent activity detected, skipping inactivity check"
      );
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

  private async checkAndHandleSessionState(): Promise<void> {
    try {
      const isEnabled = await ExtensionStorage.get<boolean>(
        INACTIVITY.STORAGE.AUTO_SIGN_OUT_ENABLED
      );
      if (!isEnabled) {
        log(LOG_GROUP.SESSION, "Auto-lock disabled");
        return;
      }

      const windows = await browser.windows.getAll({
        windowTypes: ["popup", "panel"]
      });

      if (windows.some(this.isPopupWindow)) {
        await this.recordActivity();
        return;
      }

      await this.handleInactivityCheck();
    } catch (error) {
      log(LOG_GROUP.SESSION, `Session check failed: ${error.message}`);
      await this.clearInactivityAlarm();
    }
  }

  private async handleAutoSignOut(alarm: browser.Alarms.Alarm): Promise<void> {
    if (alarm.name !== INACTIVITY.ALARM.TIMER) return;

    try {
      const decryptionKey = await getDecryptionKey();
      if (!decryptionKey) return;

      const lastActivity = await ExtensionStorage.get<number>(
        INACTIVITY.STORAGE.LAST_ACTIVITY
      );
      const now = Date.now();
      const timeout =
        (await ExtensionStorage.get<number>(
          INACTIVITY.STORAGE.AUTO_SIGN_OUT_TIME
        )) ?? INACTIVITY.DEFAULT_TIMEOUT_MINUTES;

      if (lastActivity && now - lastActivity < timeout * 60 * 1000) return;

      log(LOG_GROUP.SESSION, "Auto-locked due to inactivity");
      await removeDecryptionKey();
    } catch (error) {
      log(LOG_GROUP.SESSION, `Auto-lock failed: ${error.message}`);
      await this.clearInactivityAlarm();
    }
  }

  private setupWindowListeners(): void {
    browser.windows.onCreated.addListener((window) => {
      if (window.type === "popup" || window.type === "panel") {
        this.checkAndHandleSessionState();
      }
    });

    browser.windows.onRemoved.addListener(() =>
      this.checkAndHandleSessionState()
    );
  }

  private setupAlarmListeners(): void {
    browser.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === INACTIVITY.ALARM.TIMER) {
        await this.handleAutoSignOut(alarm);
      } else if (alarm.name === INACTIVITY.ALARM.CHECK) {
        await this.checkAndHandleSessionState();
      }
    });
  }

  private setupPeriodicCheck(): void {
    browser.alarms.create(INACTIVITY.ALARM.CHECK, { periodInMinutes: 1 });
  }

  public initialize(): void {
    this.checkAndHandleSessionState().catch((error) => {
      log(LOG_GROUP.SESSION, `Init failed: ${error.message}`);
    });

    this.setupWindowListeners();
    this.setupAlarmListeners();
    this.setupPeriodicCheck();
  }

  public recordActivity = throttle(
    async () => {
      try {
        log(LOG_GROUP.SESSION, "Recording activity");
        await ExtensionStorage.set(
          INACTIVITY.STORAGE.LAST_ACTIVITY,
          Date.now()
        );
        await this.clearInactivityAlarm();
      } catch (error) {
        log(LOG_GROUP.SESSION, `Failed to record activity: ${error.message}`);
      }
    },
    5000,
    { leading: true, trailing: false }
  );
}

export const inactivityManager = new InactivityManager();
