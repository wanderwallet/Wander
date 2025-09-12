import type { Alarms } from "webextension-polyfill";
import { getNameServiceProfiles, NAME_SERVICE_QUERY_CLIENT } from "~lib/nameservice";
import { ExtensionStorage } from "~utils/storage";
import { getWallets } from "~wallets";

/**
 * Sync nicknames with ANS labels
 */
export async function handleSyncLabelsAlarm(alarm?: Alarms.Alarm) {
  // check alarm name if called from an alarm
  if (alarm?.name !== "sync_labels") return;

  // get wallets
  const wallets = await getWallets();

  if (wallets.length === 0) return;

  // invalidate all name service profiles
  await NAME_SERVICE_QUERY_CLIENT.invalidateQueries({
    queryKey: ["name-service-profile"],
    refetchType: "all",
  });
  await NAME_SERVICE_QUERY_CLIENT.invalidateQueries({
    queryKey: ["name-service-profiles"],
    refetchType: "all",
  });

  // get profiles
  const profiles = await getNameServiceProfiles(
    wallets.map((w) => w.address),
  );

  const find = (addr: string) => profiles.find((w) => w.address === addr)?.name;

  // save updated wallets
  await ExtensionStorage.set(
    "wallets",
    wallets.map((wallet) => ({
      ...wallet,
      nickname: find(wallet.address) || wallet.nickname,
    })),
  );
}
