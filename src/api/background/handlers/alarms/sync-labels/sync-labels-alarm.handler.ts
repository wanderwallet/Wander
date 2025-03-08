import type { Alarms } from "webextension-polyfill";
import { getNameServiceProfiles } from "~lib/nameservice";
import { ExtensionStorage } from "~utils/storage";
import { getWallets } from "~wallets";

/**
 * Sync nicknames with ANS labels
 */
export async function handleSyncLabelsAlarm(alarm?: Alarms.Alarm) {
  // check alarm name if called from an alarm
  if (alarm && alarm.name !== "sync_labels") {
    return;
  }

  // get wallets
  const wallets = await getWallets();

  if (wallets.length === 0) return;

  // get profiles
  const profiles = await getNameServiceProfiles(wallets.map((w) => w.address));

  const find = (addr: string) => profiles.find((w) => w.address === addr)?.name;

  // save updated wallets
  await ExtensionStorage.set(
    "wallets",
    wallets.map((wallet) => ({
      ...wallet,
      nickname: find(wallet.address) || wallet.nickname
    }))
  );
}
