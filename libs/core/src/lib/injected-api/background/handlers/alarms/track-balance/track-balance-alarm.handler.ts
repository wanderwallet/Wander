import Arweave from "arweave";
import browser, { type Alarms } from "webextension-polyfill";
import BigNumber from "bignumber.js";
import { getWallets } from "../../../../../wallets/wallets.utils";
import { defaultGateway } from "../../../../../gateways/gateway";
import { trackDirect, EventType, setToStartOfNextMonth } from "../../../../../utils/analytics/analytics";

export async function handleTrackBalanceAlarm(alarmInfo?: Alarms.Alarm) {
  if (!alarmInfo?.name.startsWith("track-balance")) return;

  const wallets = await getWallets();
  const arweave = new Arweave(defaultGateway);

  let totalBalance = BigNumber("0");

  await Promise.all(
    wallets.map(async ({ address }) => {
      try {
        const balance = arweave.ar.winstonToAr(await arweave.wallets.getBalance(address));
        totalBalance = totalBalance.plus(balance);
      } catch (e) {
        console.log("invalid", e);
      }
    }),
  );

  try {
    await trackDirect(EventType.BALANCE, {
      totalBalance: totalBalance.toFixed(),
    });

    const timer = setToStartOfNextMonth(new Date());

    browser.alarms.create("track-balance", {
      when: timer.getTime(),
    });
  } catch (err) {
    console.log("err tracking", err);
  }
}
