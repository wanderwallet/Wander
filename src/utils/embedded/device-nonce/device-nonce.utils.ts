import { nanoid } from "nanoid";
import { setDeviceNonceHeader } from "~utils/embedded/embedded.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";

const DEVICE_NONCE_KEY = "DEVICE_NONCE";
const INVALID_DEVICE_NONCE_ERR_MSG = "Invalid deviceNonce";
const MISSING_DEVICE_NONCE_ERR_MSG = "Missing deviceNonce";

export type DeviceNonce =
  `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z-${string}`;

export function loadDeviceNonce(): DeviceNonce | null {
  let deviceNonce = localStorage.getItem(DEVICE_NONCE_KEY) || null;

  if (
    deviceNonce === null ||
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)\-[\w_-]{21}/.test(
      deviceNonce
    )
  )
    return deviceNonce as DeviceNonce;

  if (process.env.NODE_ENV === "development") {
    throw new Error(INVALID_DEVICE_NONCE_ERR_MSG);
  } else {
    console.warn(INVALID_DEVICE_NONCE_ERR_MSG);
  }
}

export function generateDeviceNonce(): DeviceNonce {
  log(LOG_GROUP.WALLET_GENERATION, "generateDeviceNonce()");

  return `${new Date().toISOString()}-${nanoid()}` as DeviceNonce;
}

export function storeDeviceNonce(deviceNonce: DeviceNonce) {
  log(LOG_GROUP.WALLET_GENERATION, "storeDeviceNonce()");

  setDeviceNonceHeader(deviceNonce);

  localStorage.setItem(DEVICE_NONCE_KEY, deviceNonce);

  return (_deviceNonce = deviceNonce);
}

let _deviceNonce: DeviceNonce | null =
  loadDeviceNonce() || generateDeviceNonce();

storeDeviceNonce(_deviceNonce);

export function getDeviceNonce(): DeviceNonce {
  if (!_deviceNonce) {
    throw new Error(MISSING_DEVICE_NONCE_ERR_MSG);
  }

  let storedDeviceNonce = localStorage.getItem(DEVICE_NONCE_KEY) || null;

  if (storedDeviceNonce === _deviceNonce) return _deviceNonce;

  return storeDeviceNonce(_deviceNonce);
}
