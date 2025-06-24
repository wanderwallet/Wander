const SharedStorageKeys = {} as const;

const BeStorageKeys = {} as const;

const ConnectStorageKeys = {
  AUTH: {
    USER_ID: "USER_ID",
    LAST_EMAIL_VERIFICATION: "LAST_EMAIL_VERIFICATION",
    LAST_PASSWORD_CHANGE: "LAST_PASSWORD_CHANGE",
    LAST_OTP_SIGN_IN: "LAST_OTP_SIGN_IN",
  },
} as const;

export const StorageKeys = {
  SHARED: SharedStorageKeys,
  BE: BeStorageKeys,
  CONNECT: ConnectStorageKeys,
} as const;
