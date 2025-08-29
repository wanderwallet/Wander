import type { Alarms } from "webextension-polyfill";
import { getWalletLifetimeSavingsFromStorage, saveWalletLifetimeSavingsToStorage } from "../../../../../utils/tier/utils";

/**
 * Alarm handler for refreshing wallet savings.
 * Refreshes the wallet savings for the given address.
 */

export async function handleRefreshWalletLifetimeSavingsAlarm(alarmInfo?: Alarms.Alarm) {
  if (!alarmInfo?.name.startsWith("wallet_lifetime_savings_")) return;

  const address = alarmInfo.name.replace("wallet_lifetime_savings_", "");

  const walletSavings = await getWalletLifetimeSavingsFromStorage(address);

  if (!walletSavings) return;

  await saveWalletLifetimeSavingsToStorage(address, walletSavings.lifetimeSavings, false);
}
