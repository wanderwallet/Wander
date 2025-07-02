import { PersistentStorage } from "~utils/storage";
import { StorageKeys } from "~utils/storage/storage.constants";

export const OTP_LENGTH = 6;
export const OPT_COOLDOWN_DURATION_SEC = 60; // 1 minute
export const OTP_EXPIRATION_SEC = 3600; // 1 hour

/**
 * While a new OTP can be requested every 60 seconds, an OTP actually expires in 24h. Therefore, when we request a new
 * OTP, we keep track of whether it has been used or not. If at some point we need to request a new one, but the
 * previous one hasn't been used, we just don't. The user can still request it manually if it's been more than 60
 * seconds.
 */
export async function checkNeedsNewOtp() {
  const [lastCalledAt, otpAvailable] = await Promise.all([
    PersistentStorage.getItem(StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL),
    PersistentStorage.getItem(StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL_AVAILABLE),
  ]);

  const elapsedSeconds = Math.round((Date.now() - parseInt(lastCalledAt || "0")) / 1000);

  // We've already sent an OTP in the last 60 seconds:
  if (elapsedSeconds < OPT_COOLDOWN_DURATION_SEC) return false;

  // The last OTP that was sent was sent more than 24h ago, so it has expired:
  if (elapsedSeconds >= OTP_EXPIRATION_SEC) return true;

  // At this point, we could request a new OTP, but do we actually need a new one or is the previous one still around?
  return !otpAvailable;
}

export async function setOtpAvailable() {
  PersistentStorage.setItem(StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL_AVAILABLE, "1");
}

export function clearOtpAvailable() {
  PersistentStorage.removeItem(StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL_AVAILABLE);
}
