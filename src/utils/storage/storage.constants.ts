const SharedStorageKeys = {} as const;

const BeStorageKeys = {} as const;

const ConnectStorageKeys = {
  SUPPORT: {
    UNPARTITIONED_STATE_CONFIRMED: "UNPARTITIONED_STATE_CONFIRMED",
  },
  AUTH: {
    USER_ID: "USER_ID",
    LAST_OTP_EMAIL: "LAST_OTP_EMAIL",
    LAST_OTP_EMAIL_AVAILABLE: "LAST_OTP_EMAIL_AVAILABLE",
    PREFERRED_EMAIL_AUTH: "PREFERRED_EMAIL_AUTH",
    IS_USING_BE: "IS_USING_BE",
  },
} as const;

export const StorageKeys = {
  SHARED: SharedStorageKeys,
  BE: BeStorageKeys,
  CONNECT: ConnectStorageKeys,
} as const;
