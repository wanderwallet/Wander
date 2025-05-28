export const SharedStorageKeys = {} as const;

export const BeStorageKeys = {} as const;

export const ConnectStorageKeys = {
  AUTH: {
    USER_ID: "USER_ID",
  },
} as const;

export const StorageKeys = {
  SHARED: SharedStorageKeys,
  BE: BeStorageKeys,
  CONNECT: ConnectStorageKeys,
} as const;
