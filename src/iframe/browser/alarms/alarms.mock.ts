import type { Alarms } from "webextension-polyfill";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import { log, LOG_GROUP } from "~utils/log/log.utils";

interface AlarmWithTimer extends Alarms.Alarm {
  timeoutID?: number;
  intervalID?: number;
  // Track if this alarm was created by background script after a page load
  sourceTracking?: {
    loadedFromStorage: boolean;
    recreatedByScript: boolean;
  };
  // Store original creation time for more accurate periodic timer calculation
  createdAt?: number;
}

type AlarmCallback = (alarm?: Alarms.Alarm) => void;
type AlarmInfoSetup = {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
  delayInMs: number;
  periodInMs: number;
};

let alarmsByName: Record<string, AlarmWithTimer> = {};
let alarmCallbacks: AlarmCallback[] = [];
const loadedFromStorageAlarms = new Set<string>();
const MAX_32_BIT = 0x7fffffff;
const STORAGE_KEY = "WANDER_ALARMS";

// Helper function to invoke all registered callbacks for an alarm
function invokeAlarms(name: string) {
  const alarm = alarmsByName[name];
  if (!alarm) return;

  const callbackAlarm = {
    name: alarm.name,
    scheduledTime: alarm.scheduledTime,
    periodInMinutes: alarm.periodInMinutes
  };

  alarmCallbacks.forEach((callback) => {
    try {
      callback(callbackAlarm);
    } catch (error) {
      log(LOG_GROUP.ALARMS, `Error in alarm callback: ${error}`);
    }
  });
}

// Helper function to set up alarm timers based on delay and period
function setupAlarmTimers(
  alarm: AlarmWithTimer,
  delayInMs: number,
  periodInMs: number
) {
  try {
    // Save original creation time for periodic alarms to ensure consistent timing
    if (!alarm.createdAt) {
      alarm.createdAt = Date.now();
    }

    if (delayInMs <= 0) {
      if (delayInMs === 0) {
        invokeAlarms(alarm.name);
      }

      if (periodInMs > 0) {
        setupRecurringInterval(alarm, periodInMs);
      }
    } else {
      alarm.timeoutID = window.setTimeout(() => {
        delete alarm.timeoutID;
        invokeAlarms(alarm.name);

        if (periodInMs > 0) {
          setupRecurringInterval(alarm, periodInMs);
        }
      }, delayInMs);
    }
  } catch (error) {
    log(LOG_GROUP.ALARMS, `Error setting up alarm timers: ${error}`);
    // Clean up any partially set up timers
    clearAlarmTimers(alarm);
  }
}

// Helper function to setup a recurring interval for an alarm
function setupRecurringInterval(alarm: AlarmWithTimer, periodInMs: number) {
  // Calculate next scheduled time based on the original pattern
  const now = Date.now();
  const timeSinceCreation = now - (alarm.createdAt || now);
  const periodsElapsed = Math.floor(timeSinceCreation / periodInMs);
  const nextScheduledTime =
    (alarm.createdAt || now) + (periodsElapsed + 1) * periodInMs;

  alarm.scheduledTime = nextScheduledTime;

  alarm.intervalID = window.setInterval(() => {
    // Update based on a consistent pattern to avoid drift
    alarm.scheduledTime = alarm.scheduledTime + periodInMs;
    invokeAlarms(alarm.name);
  }, periodInMs);
}

// Helper function to clear timers for an alarm
function clearAlarmTimers(alarm: AlarmWithTimer) {
  if (alarm.timeoutID) {
    window.clearTimeout(alarm.timeoutID);
    delete alarm.timeoutID;
  }
  if (alarm.intervalID) {
    window.clearInterval(alarm.intervalID);
    delete alarm.intervalID;
  }
}

// Calculate timing values from alarm info
function calculateTimingValues(
  alarmInfo: Alarms.CreateAlarmInfoType,
  name: string
): AlarmInfoSetup {
  const now = Date.now();

  // Determine scheduledTime and delayInMs based on provided parameters
  let scheduledTime: number;
  let delayInMs: number;

  if (alarmInfo.when !== undefined) {
    // When parameter takes precedence
    scheduledTime = alarmInfo.when;
    delayInMs = Math.max(0, Math.min(MAX_32_BIT, scheduledTime - now));
  } else if (alarmInfo.delayInMinutes !== undefined) {
    // Next is delayInMinutes
    delayInMs = Math.min(MAX_32_BIT, alarmInfo.delayInMinutes * 60000);
    scheduledTime = now + delayInMs;
  } else if (alarmInfo.periodInMinutes !== undefined) {
    // If only periodInMinutes is provided, first alarm fires after that period
    delayInMs = Math.min(MAX_32_BIT, alarmInfo.periodInMinutes * 60000);
    scheduledTime = now + delayInMs;
  } else {
    // This should be unreachable due to the validation above
    delayInMs = 0;
    scheduledTime = now;
  }

  // Calculate periodInMs (0 means non-repeating)
  const periodInMs =
    alarmInfo.periodInMinutes !== undefined
      ? Math.min(MAX_32_BIT, alarmInfo.periodInMinutes * 60000)
      : 0;

  return {
    name,
    scheduledTime,
    periodInMinutes: alarmInfo.periodInMinutes,
    delayInMs,
    periodInMs
  };
}

// Load alarms from localStorage
export async function loadAlarms() {
  try {
    const storage = await LocalStorage.getInstance();
    const storedAlarms =
      storage.getItem<Array<Alarms.Alarm & { createdAt?: number }>>(
        STORAGE_KEY
      );

    if (!storedAlarms?.length) return;

    const now = Date.now();
    let alarmsLoaded = 0;

    for (const storedAlarm of storedAlarms) {
      // Skip one-time alarms that have already fired
      if (!storedAlarm.periodInMinutes && storedAlarm.scheduledTime <= now) {
        continue;
      }

      // For periodic alarms, calculate next occurrence according to Chrome's behavior
      if (storedAlarm.periodInMinutes && storedAlarm.scheduledTime <= now) {
        const periodMs = storedAlarm.periodInMinutes * 60000;

        // If we have the original creation time, use it for more accurate time alignment
        if (storedAlarm.createdAt) {
          // Calculate how many periods have elapsed since creation
          const timeSinceCreation = now - storedAlarm.createdAt;
          const periodsElapsed = Math.floor(timeSinceCreation / periodMs);

          // Schedule for the next period boundary aligned with original creation
          storedAlarm.scheduledTime =
            storedAlarm.createdAt + (periodsElapsed + 1) * periodMs;
        } else {
          // Without original creation time, simply schedule next occurrence from now
          // This matches Chrome's behavior of "starting from when the device wakes"
          storedAlarm.scheduledTime = now + periodMs;
        }

        // Ensure the time is in the future (should always be, but for safety)
        if (storedAlarm.scheduledTime <= now) {
          storedAlarm.scheduledTime = now + periodMs;
        }
      }

      // Create alarm and mark it as loaded from storage
      const alarm = await createAlarmInternal(
        storedAlarm.name,
        {
          when: storedAlarm.scheduledTime,
          periodInMinutes: storedAlarm.periodInMinutes
        },
        false
      );

      // Preserve createdAt if available
      if (storedAlarm.createdAt) {
        alarm.createdAt = storedAlarm.createdAt;
      }

      alarm.sourceTracking = {
        loadedFromStorage: true,
        recreatedByScript: false
      };

      loadedFromStorageAlarms.add(storedAlarm.name);
      alarmsLoaded++;
    }

    log(LOG_GROUP.ALARMS, `Loaded ${alarmsLoaded} alarms from localStorage`);
  } catch (error) {
    log(LOG_GROUP.ALARMS, `Error loading alarms: ${error}`);
  }
}

// Simpler persistence function that preserves createdAt
async function persistAlarms() {
  try {
    const storage = await LocalStorage.getInstance();

    const alarmsToStore = Object.values(alarmsByName).map((alarm) => ({
      name: alarm.name,
      scheduledTime: alarm.scheduledTime,
      periodInMinutes: alarm.periodInMinutes,
      createdAt: alarm.createdAt
    }));

    storage.setItem(STORAGE_KEY, alarmsToStore);

    log(
      LOG_GROUP.ALARMS,
      `Saved ${alarmsToStore.length} alarms to localStorage`
    );
  } catch (error) {
    log(LOG_GROUP.ALARMS, `Error persisting alarms: ${error}`);
  }
}

async function createAlarmInternal(
  name: string,
  alarmInfo: Alarms.CreateAlarmInfoType,
  shouldSave: boolean = true
) {
  try {
    // Validate parameters according to API spec
    if (
      alarmInfo.when !== undefined &&
      alarmInfo.delayInMinutes !== undefined
    ) {
      throw new Error("Cannot specify both 'when' and 'delayInMinutes'");
    }

    if (
      alarmInfo.when === undefined &&
      alarmInfo.delayInMinutes === undefined &&
      alarmInfo.periodInMinutes === undefined
    ) {
      throw new Error(
        "Either 'when', 'delayInMinutes', or 'periodInMinutes' must be specified"
      );
    }

    // Check if this alarm already exists and was loaded from storage
    const existingAlarm = alarmsByName[name];
    const isRecreatingSameAlarm =
      existingAlarm &&
      existingAlarm?.sourceTracking?.loadedFromStorage &&
      !existingAlarm?.sourceTracking.recreatedByScript;

    if (isRecreatingSameAlarm) {
      // This is the background script trying to create an alarm we already loaded
      existingAlarm.sourceTracking.recreatedByScript = true;

      // Calculate what the new timing would be
      const {
        scheduledTime,
        periodInMinutes: newPeriodInMinutes,
        delayInMs,
        periodInMs
      } = calculateTimingValues(alarmInfo, name);

      // Needs update if period has changed or scheduled time differs significantly (more than 10 seconds)
      const needsUpdate =
        newPeriodInMinutes !== existingAlarm.periodInMinutes ||
        Math.abs(existingAlarm.scheduledTime - scheduledTime) > 10000;

      if (needsUpdate) {
        existingAlarm.periodInMinutes = newPeriodInMinutes;
        existingAlarm.scheduledTime = scheduledTime;

        // clear and set up new timers
        clearAlarmTimers(existingAlarm);
        setupAlarmTimers(existingAlarm, delayInMs, periodInMs);

        if (shouldSave) {
          await persistAlarms();
        }
      }

      return existingAlarm;
    }

    // Clear any existing alarm with this name
    if (existingAlarm) {
      clearAlarmTimers(existingAlarm);
    }

    // Calculate timing values
    const { scheduledTime, periodInMinutes, delayInMs, periodInMs } =
      calculateTimingValues(alarmInfo, name);

    // Create the new alarm
    const alarmWithTimer: AlarmWithTimer = {
      name,
      scheduledTime,
      periodInMinutes,
      createdAt: Date.now()
    };

    alarmsByName[name] = alarmWithTimer;

    // Set up timers for the alarm
    setupAlarmTimers(alarmWithTimer, delayInMs, periodInMs);

    // Save to localStorage if requested
    if (shouldSave) {
      await persistAlarms();
    }

    return alarmWithTimer;
  } catch (error) {
    log(LOG_GROUP.ALARMS, `Error creating alarm ${name}: ${error}`);
    throw error;
  }
}

export const alarms = {
  create: async (name: string, alarmInfo: Alarms.CreateAlarmInfoType) => {
    await createAlarmInternal(name, alarmInfo, true);
  },

  clear: async (name: string) => {
    const alarm = alarmsByName[name];
    if (!alarm) return;

    clearAlarmTimers(alarm);
    delete alarmsByName[name];
    loadedFromStorageAlarms.delete(name);
    await persistAlarms();
  },

  clearAll: async () => {
    Object.values(alarmsByName).forEach((alarm) => {
      clearAlarmTimers(alarm);
    });
    alarmsByName = {};
    loadedFromStorageAlarms.clear();
  },

  getAll: async () => {
    return Object.values(alarmsByName).map((alarm) => ({
      name: alarm.name,
      scheduledTime: alarm.scheduledTime,
      periodInMinutes: alarm.periodInMinutes
    }));
  },

  get: async (name: string) => {
    const alarm = alarmsByName[name];
    if (!alarm) return undefined;

    return {
      name: alarm.name,
      scheduledTime: alarm.scheduledTime,
      periodInMinutes: alarm.periodInMinutes
    };
  },

  onAlarm: {
    addListener: (alarmCallback: AlarmCallback) => {
      alarmCallbacks.push(alarmCallback);
    },
    removeListener: (alarmCallback: AlarmCallback) => {
      alarmCallbacks = alarmCallbacks.filter(
        (callback) => callback !== alarmCallback
      );
    }
  }
};

// Initialize by loading alarms from localStorage
loadAlarms();
