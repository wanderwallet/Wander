import type { Alarms } from "webextension-polyfill";
import { getDecryptionKey, removeDecryptionKey } from "../../../../../wallets/auth";

/**
 * Listener for the key removal alarm
 */
export async function handleKeyRemovalAlarm(alarm: Alarms.Alarm) {
  if (alarm?.name !== "remove_decryption_key_scheduled") return;

  // check if there is a decryption key
  const decryptionKey = await getDecryptionKey();
  if (!decryptionKey) return;

  // remove the decryption key
  await removeDecryptionKey();
}
