export const INACTIVITY = {
  ALARM: {
    TIMER: "inactivity_alarm",
    CHECK: "inactivity_check"
  },
  STORAGE: {
    LAST_ACTIVITY: "last_activity_timestamp",
    AUTO_LOCK: "auto_lock"
  },
  POPUP: {
    WIDTH: 385,
    HEIGHT: 720,
    SIZE_TOLERANCE: 20
  },
  DEFAULT_TIMEOUT_MINUTES: 5,
  CACHE_TTL: 60000, // 1 minute cache TTL
  THROTTLE_TIME: 5000 // 5 seconds throttle time
} as const;
