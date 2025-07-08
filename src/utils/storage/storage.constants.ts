const SharedStorageKeys = {} as const;

const BeStorageKeys = {} as const;

const ConnectStorageKeys = {
  AUTH: {
    USER_ID: "USER_ID",
    LAST_OTP_EMAIL: "LAST_OTP_EMAIL",
    LAST_OTP_EMAIL_AVAILABLE: "LAST_OTP_EMAIL_AVAILABLE",
    PREFERRED_EMAIL_AUTH: "PREFERRED_EMAIL_AUTH",
  },
} as const;

export const StorageKeys = {
  SHARED: SharedStorageKeys,
  BE: BeStorageKeys,
  CONNECT: ConnectStorageKeys,
} as const;
