const SharedStorageKeys = {} as const;

const BeStorageKeys = {} as const;

const ConnectStorageKeys = {
  AUTH: {
    USER_ID: "USER_ID",
    LAST_EMAIL_VERIFICATION: "LAST_EMAIL_VERIFICATION",
  },
} as const;

export const StorageKeys = {
  SHARED: SharedStorageKeys,
  BE: BeStorageKeys,
  CONNECT: ConnectStorageKeys,
} as const;
