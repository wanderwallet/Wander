export const UNPARTITIONED_STATE_STATUS_CHANGE_EVENT = "UNPARTITIONED_STATE_STATUS_CHANGE" as const;

export type UnpartitionedStateStatusChangeEvent = CustomEvent<{
  unpartitionedStateStatus: UnpartitionedStateStatus;
  error?: Error;
}>;

export const HAS_SIMPLE_STORAGE_API =
  typeof document.hasStorageAccess === "function" && typeof document.requestStorageAccess === "function";

export const HAS_ADVANCED_STORAGE_API = typeof (document as any).hasUnpartitionedCookieAccess === "function";

export type UnpartitionedStateStatus = "supported" | "unsupported" | "limited" | "rejected" | "error";

let _unpartitionedStateStatus: UnpartitionedStateStatus = HAS_SIMPLE_STORAGE_API
  ? HAS_ADVANCED_STORAGE_API
    ? "supported"
    : "limited"
  : "unsupported";

export function getUnpartitionedStateStatus() {
  return _unpartitionedStateStatus;
}

export function setUnpartitionedStateStatus(unpartitionedStateStatus: UnpartitionedStateStatus) {
  _unpartitionedStateStatus = unpartitionedStateStatus;
}
