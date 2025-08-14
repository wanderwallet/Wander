import type { Alarms } from "webextension-polyfill";
import { checkIfTransakPurchaseSucceeded } from "~utils/transak/transak.alarms";
import { TRANSAK_PURCHASE_ALARM_NAME_PREFIX } from "~utils/transak/transak.constants";

/**
 * Alarm handler for checking if transak purchase has succeeded.
 * Checks if any transak purchase has succeeded and updates the transak purchase list.
 */
export async function handleTransakPurchaseAlarm(alarmInfo?: Alarms.Alarm) {
  if (alarmInfo && !alarmInfo.name.startsWith(TRANSAK_PURCHASE_ALARM_NAME_PREFIX)) return;

  const address = alarmInfo.name.replace(TRANSAK_PURCHASE_ALARM_NAME_PREFIX, "");
  await checkIfTransakPurchaseSucceeded(address);
}
