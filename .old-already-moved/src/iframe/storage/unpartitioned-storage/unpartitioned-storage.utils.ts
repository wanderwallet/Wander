export const HAS_SIMPLE_STORAGE_API =
  import.meta.env?.VITE_IS_EMBEDDED_APP === "1" &&
  typeof document !== "undefined" &&
  typeof document.hasStorageAccess === "function" &&
  typeof document.requestStorageAccess === "function";

export const HAS_ADVANCED_STORAGE_API =
  HAS_SIMPLE_STORAGE_API && typeof (document as any).hasUnpartitionedCookieAccess === "function";

export type UnpartitionedStateStatus = "supported" | "unsupported" | "limited" | "rejected" | "error";

let _unpartitionedStateStatus: UnpartitionedStateStatus = HAS_SIMPLE_STORAGE_API
  ? HAS_ADVANCED_STORAGE_API
    ? "supported"
    : "limited"
  : "unsupported";

export interface UnpartitionedStateStatusChangeData {
  unpartitionedStateStatus: UnpartitionedStateStatus;
  prevUnpartitionedStateStatus: UnpartitionedStateStatus;
  error?: Error;
}

type UnpartitionedStateStatusChangeCallback = (data: UnpartitionedStateStatusChangeData) => void;

const unpartitionedStateStatusChangeCallbacks = new Set<UnpartitionedStateStatusChangeCallback>();

export function addUnpartitionedStateStatusChangeListener(fn: UnpartitionedStateStatusChangeCallback) {
  fn({ unpartitionedStateStatus: _unpartitionedStateStatus, prevUnpartitionedStateStatus: _unpartitionedStateStatus });
  unpartitionedStateStatusChangeCallbacks.add(fn);
}

export function removeUnpartitionedStateStatusChangeListener(fn: UnpartitionedStateStatusChangeCallback) {
  unpartitionedStateStatusChangeCallbacks.delete(fn);
}

export function getUnpartitionedStateStatus() {
  return _unpartitionedStateStatus;
}

export function setUnpartitionedStateStatus(unpartitionedStateStatus: UnpartitionedStateStatus, error?: Error) {
  const prevUnpartitionedStateStatus = _unpartitionedStateStatus;

  _unpartitionedStateStatus = unpartitionedStateStatus;

  unpartitionedStateStatusChangeCallbacks.forEach((cb) => {
    cb({ unpartitionedStateStatus, prevUnpartitionedStateStatus, error });
  });
}
