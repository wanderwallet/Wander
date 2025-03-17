import { nanoid } from "nanoid";
import {
  getStorage,
  setDeviceNonceHeader
} from "~utils/embedded/embedded.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";

const DEVICE_NONCE_KEY = "DEVICE_NONCE";
const INVALID_DEVICE_NONCE_ERR_MSG = "Invalid deviceNonce";
const MISSING_DEVICE_NONCE_ERR_MSG = "Missing deviceNonce";

export type DeviceNonce =
  `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z-${string}`;

let _deviceNonce: DeviceNonce | null = null;

export async function loadDeviceNonce(): Promise<DeviceNonce | null> {
  const storage = await getStorage();
  let deviceNonce = storage.getItem(DEVICE_NONCE_KEY) || null;

  if (
    deviceNonce === null ||
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)\-[\w_-]{21}/.test(
      deviceNonce
    )
  ) {
    return deviceNonce as DeviceNonce;
  }

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

export async function storeDeviceNonce(
  deviceNonce: DeviceNonce
): Promise<DeviceNonce> {
  log(LOG_GROUP.WALLET_GENERATION, "storeDeviceNonce()");

  setDeviceNonceHeader(deviceNonce);

  const storage = await getStorage();
  storage.setItem(DEVICE_NONCE_KEY, deviceNonce);

  return (_deviceNonce = deviceNonce);
}

export async function initializeDeviceNonce(): Promise<DeviceNonce> {
  if (_deviceNonce) return _deviceNonce;

  const loadedNonce = await loadDeviceNonce();
  _deviceNonce = loadedNonce || generateDeviceNonce();

  setDeviceNonceHeader(_deviceNonce);

  if (!loadedNonce) {
    await storeDeviceNonce(_deviceNonce);
  }

  return _deviceNonce;
}

export async function getDeviceNonce(): Promise<DeviceNonce> {
  await initializeDeviceNonce();

  if (!_deviceNonce) {
    throw new Error(MISSING_DEVICE_NONCE_ERR_MSG);
  }

  const storage = await getStorage();
  let storedDeviceNonce = storage.getItem(DEVICE_NONCE_KEY) || null;

  if (storedDeviceNonce === _deviceNonce) return _deviceNonce;

  return storeDeviceNonce(_deviceNonce);
}

initializeDeviceNonce().catch((err) => {
  log(LOG_GROUP.WALLET_GENERATION, "initializeDeviceNonce() error: ", { err });
});
