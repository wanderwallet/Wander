import browser from "webextension-polyfill";
import { getAoTokens, getAoTokensAutoImportRestrictedIds } from "~tokens";
import { AO_TOKENS, tokenStorageMutex } from "~tokens/aoTokens/sync";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { PersistentStorage } from "~utils/storage";
import { getWallets } from "~wallets";
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

    const [aoTokens, removedTokenIds = []] = await Promise.all([getAoTokens(), getAoTokensAutoImportRestrictedIds()]);
    const tokenIdstoExclude = new Set([...aoTokens.map(({ processId }) => processId), ...removedTokenIds]);

    const flpTokens = (await getFairLaunchTokens()).filter((token) => !tokenIdstoExclude.has(token.processId));
    if (flpTokens.length === 0) {
      log(LOG_GROUP.FAIR_LAUNCH, "No fair launch tokens to check");
      return;
    }

    const wallets = await getWallets();
    const addresses = wallets.map((wallet) => wallet.address);

    const promises = flpTokens.map(async (token) => {
      try {
        for (const address of addresses) {
          try {
            const balance = await retryWithDelay(() => fetchTokenBalance(token, address));
            if (+balance > 0) return true;
          } catch {}
        }
        return false;
      } catch {
        return false;
      }
    });

    const results = await Promise.all(promises);
    const flpTokensWithBalance = flpTokens.filter((_, index) => results[index]);
    if (flpTokensWithBalance.length === 0) {
      log(LOG_GROUP.FAIR_LAUNCH, "No fair launch tokens with balance");
      return;
    }

    log(LOG_GROUP.FAIR_LAUNCH, "Importing fair launch tokens: ", flpTokensWithBalance);

    const unlock = await tokenStorageMutex.lock();
    try {
      const freshAoTokens = await getAoTokens();
      const tokenIds = new Set(freshAoTokens.map(({ processId }) => processId));

      flpTokensWithBalance.forEach((token) => {
        if (!tokenIds.has(token.processId)) {
          freshAoTokens.push(token);
        }
      });

      await PersistentStorage.set(AO_TOKENS, freshAoTokens);

      log(LOG_GROUP.FAIR_LAUNCH, "Imported fair launch tokens!");
    } finally {
      unlock();
    }
  } catch (error) {
    log(LOG_GROUP.FAIR_LAUNCH, "Error importing fair launch tokens: ", error);
  }
}
