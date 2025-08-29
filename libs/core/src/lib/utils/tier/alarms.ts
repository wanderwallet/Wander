import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";

export async function scheduleRefreshWalletLifetimeSavings(address: string) {
  try {
    const alarmName = `wallet_lifetime_savings_${address}`;
    const alarms = await browser.alarms.get(alarmName);
    if (alarms) {
      await browser.alarms.clear(alarmName);
    }

    browser.alarms.create(alarmName, { delayInMinutes: 1 });
  } catch (error) {
    log(LOG_GROUP.TIERS, "Error scheduling refresh wallet savings", error);
  }
}
