import browser from "webextension-polyfill";
import { getAoTokens, getAoTokensAutoImportRestrictedIds } from "~tokens";
import { AO_TOKENS } from "~tokens/aoTokens/sync";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { PersistentStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import { getFairLaunchTokens } from "./fair_launch.utils";
import { fetchTokenBalance } from "~tokens/aoTokens/ao";
import { retryWithDelay } from "~utils/promises/retry";
import { FAIR_LAUNCH_TOKENS_ALARM_NAME } from "./fair_launch.constants";

export async function scheduleFairLaunchTokensAlarm() {
  try {
    const alarmName = FAIR_LAUNCH_TOKENS_ALARM_NAME;
    const alarm = await browser.alarms.get(alarmName);
    if (alarm) return;

    // create alarm to run every day
    browser.alarms.create(alarmName, { delayInMinutes: 1, periodInMinutes: 1440 });
  } catch (error) {
    log(LOG_GROUP.FAIR_LAUNCH, "Error scheduling fair launch tokens alarm", error);
  }
}

export async function checkAndImportFairLaunchTokens() {
  try {
    log(LOG_GROUP.FAIR_LAUNCH, "Checking and importing fair launch tokens");

    let [aoTokens, removedTokenIds = []] = await Promise.all([getAoTokens(), getAoTokensAutoImportRestrictedIds()]);
    let tokenIdstoExclude = new Set([...aoTokens.map(({ processId }) => processId), ...removedTokenIds]);

    let flpTokens = await getFairLaunchTokens();
    flpTokens = flpTokens.filter((token) => !tokenIdstoExclude.has(token.processId));

    if (flpTokens.length === 0) {
      log(LOG_GROUP.FAIR_LAUNCH, "No fair launch tokens to import");
      return;
    }

    const activeAddress = await getActiveAddress();

    const promises = flpTokens.map(async (token) => {
      const balance = await retryWithDelay(() => fetchTokenBalance(token, activeAddress));
      return balance || "0";
    });

    const results = await Promise.allSettled(promises);
    const balances = results.map((result) => (result.status === "fulfilled" ? result.value : "0"));
    const flpTokensWithBalance = flpTokens.filter((_, index) => +balances[index] > 0);

    if (flpTokensWithBalance.length === 0) {
      log(LOG_GROUP.FAIR_LAUNCH, "No fair launch tokens to import");
      return;
    }

    log(LOG_GROUP.FAIR_LAUNCH, "Importing fair launch tokens: ", flpTokensWithBalance);

    aoTokens = await getAoTokens();
    flpTokensWithBalance.forEach((token) => aoTokens.push(token));
    await PersistentStorage.set(AO_TOKENS, aoTokens);

    log(LOG_GROUP.FAIR_LAUNCH, "Imported fair launch tokens!");
  } catch (error) {
    log(LOG_GROUP.FAIR_LAUNCH, "Error importing fair launch tokens: ", error);
  }
}
