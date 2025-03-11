export const INACTIVITY = {
  ALARM: {
    TIMER: "inactivity_alarm",
    CHECK: "inactivity_check"
  },
  STORAGE: {
    LAST_ACTIVITY: "last_activity_timestamp",
    AUTO_SIGN_OUT_ENABLED: "auto_sign_out_enabled",
    AUTO_SIGN_OUT_TIME: "auto_sign_out_time"
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
