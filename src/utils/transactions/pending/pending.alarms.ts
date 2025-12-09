import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  PENDING_TRANSACTIONS_ALARM_NAME,
  PENDING_ALARM_INTERVAL_MINUTES,
  AO_PENDING_CLEANUP_ALARM_NAME_PREFIX,
  PENDING_ALARM_CLEANUP_INTERVALS,
  PENDING_ALARM_CONFLICT_THRESHOLD_MS,
  PENDING_ALARM_INTERVAL_MS,
  THIRTY_MS,
} from "~utils/transactions/pending/pending.constants";

/**
 * Schedule the pending transactions cleanup alarm
 * Runs immediately and then every 5 minutes to check for confirmed transactions
 */
export async function schedulePendingTransactionsCleanupAlarm() {
  const existingAlarm = await browser.alarms.get(PENDING_TRANSACTIONS_ALARM_NAME);
  if (existingAlarm) return;

  // Clear existing alarm if any
  await browser.alarms.clear(PENDING_TRANSACTIONS_ALARM_NAME);

  // Create new alarm that runs every 5 minutes
  browser.alarms.create(PENDING_TRANSACTIONS_ALARM_NAME, {
    delayInMinutes: 0, // Start immediately
    periodInMinutes: PENDING_ALARM_INTERVAL_MINUTES,
  });
}

export async function clearPendingTransactionsAlarm() {
  await Promise.all(
    PENDING_ALARM_CLEANUP_INTERVALS.map(async (interval) => {
      const name = `${AO_PENDING_CLEANUP_ALARM_NAME_PREFIX}${interval}s`;
      const alarm = await browser.alarms.get(name);
      if (alarm) await browser.alarms.clear(name);
    }),
  );

  browser.alarms.clear(PENDING_TRANSACTIONS_ALARM_NAME);
}

/**
 * Schedule AO transaction cleanup alarms at aligned intervals.
 */
export async function scheduleAoTransactionCleanupAlarms(): Promise<void> {
  try {
    await schedulePendingTransactionsCleanupAlarm();

    const now = Date.now();

    const mainAlarm = await browser.alarms.get(PENDING_TRANSACTIONS_ALARM_NAME);
    const nextBoundary = Math.ceil(now / THIRTY_MS) * THIRTY_MS;

    // Detect if aligned time conflicts with the main alarm run
    const conflictsWithMain = (targetTime: number): boolean => {
      if (!mainAlarm?.scheduledTime) return false;

      for (let t = mainAlarm.scheduledTime; t <= now + PENDING_ALARM_INTERVAL_MS; t += PENDING_ALARM_INTERVAL_MS) {
        if (Math.abs(targetTime - t) < PENDING_ALARM_CONFLICT_THRESHOLD_MS) return true;
      }
      return false;
    };

    for (const secs of PENDING_ALARM_CLEANUP_INTERVALS) {
      const name = `${AO_PENDING_CLEANUP_ALARM_NAME_PREFIX}${secs}s`;
      const nextTime = nextBoundary + secs * 1000;

      if (conflictsWithMain(nextTime)) continue;

      const existing = await browser.alarms.get(name);

      // Only create/update if no alarm or scheduled later than our aligned time
      if (!existing || existing.scheduledTime! > nextTime) {
        await browser.alarms.clear(name);
        browser.alarms.create(name, { when: nextTime });
      }
    }
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error scheduling AO transaction cleanup alarms:", error);
  }
}
