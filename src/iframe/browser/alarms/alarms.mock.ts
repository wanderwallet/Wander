import type { Alarms } from "webextension-polyfill";

interface AlarmWithTimer extends Alarms.Alarm {
  timeoutID?: number;
  intervalID?: number;
}

const alarmsByName: Record<string, AlarmWithTimer> = {};

type AlarmCallback = (alarm?: Alarms.Alarm) => void;

const alarmCallbacks: AlarmCallback[] = [];

function invokeAlarms(name: string) {
  const alarmWithTimer = alarmsByName[name];

  if (!alarmWithTimer) return;

  alarmCallbacks.forEach((alarmCallback) => {
    alarmCallback({
      name: alarmWithTimer.name,
      scheduledTime: alarmWithTimer.scheduledTime,
      periodInMinutes: alarmWithTimer.periodInMinutes
    });
  });
}

// setTimeout and setInterval delays have a max. value that if we exceed, just causes the callback to be invoked
// immediately.

const MAX_32_BIT = 0x7fffffff;

export const alarms = {
  create: (name: string, alarmInfo: Alarms.CreateAlarmInfoType) => {
    const periodInMs = Math.min(
      MAX_32_BIT,
      (alarmInfo.periodInMinutes ?? -1) * 60000
    );

    const delayInMs = Math.min(
      MAX_32_BIT,
      alarmInfo.when
        ? alarmInfo.when - Date.now()
        : (alarmInfo.delayInMinutes ?? -1) * 60000
    );

    const alarmWithTimer: AlarmWithTimer = {
      name,
      scheduledTime: 0,
      periodInMinutes: alarmInfo.periodInMinutes
    };

    alarmsByName[name] = alarmWithTimer;

    // TODO: Record last alarm run in localStorage to continue the alarm when reloading...

    if (delayInMs === 0) {
      alarmWithTimer.scheduledTime = Date.now();
      invokeAlarms(name);
    } else if (delayInMs > 0) {
      alarmWithTimer.scheduledTime = Date.now() + delayInMs;

      alarmWithTimer.timeoutID = window.setTimeout(() => {
        delete alarmWithTimer.timeoutID;

        invokeAlarms(name);

        if (periodInMs <= 0) return;

        alarmWithTimer.scheduledTime = Date.now() + periodInMs;

        alarmWithTimer.intervalID = window.setInterval(() => {
          alarmWithTimer.scheduledTime = Date.now() + periodInMs;

          invokeAlarms(name);
        }, periodInMs);
      }, delayInMs);
    }

    if (delayInMs <= 0 && periodInMs > 0) {
      alarmWithTimer.scheduledTime = Date.now() + periodInMs;

      alarmWithTimer.intervalID = window.setInterval(() => {
        alarmWithTimer.scheduledTime = Date.now() + periodInMs;

        invokeAlarms(name);
      }, periodInMs);
    }
  },

  clear: (name: string) => {
    const alarmWithTimer = alarmsByName[name];

    if (!alarmWithTimer) return;

    if (alarmWithTimer.timeoutID) clearTimeout(alarmWithTimer.timeoutID);
    if (alarmWithTimer.intervalID) clearTimeout(alarmWithTimer.intervalID);
  },

  getAll: () => {
    return Promise.resolve(
      Object.values(alarmsByName) satisfies Alarms.Alarm[]
    );
  },

  get: (name: string) => {
    const alarmWithTimer = alarmsByName[name];

    if (!alarmWithTimer) return;

    return {
      name: alarmWithTimer.name,
      scheduledTime: alarmWithTimer.scheduledTime,
      periodInMinutes: alarmWithTimer.periodInMinutes
    };
  },

  onAlarm: {
    addListener: (alarmCallback: AlarmCallback) => {
      alarmCallbacks.push(alarmCallback);
    }
  }
};
