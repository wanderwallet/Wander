import { PersistentStorage } from "~utils/storage";
import type { Alarms } from "webextension-polyfill";
import { type TokenInfo, getTokenInfo } from "~tokens/aoTokens/ao";
import { timeoutPromise } from "~utils/promises/timeout";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";

/**
 * Alarm handler for syncing ao tokens
 */
export const handleAoTokenCacheAlarm = async (alarmInfo?: Alarms.Alarm) => {
  if (!alarmInfo?.name.startsWith("update_ao_tokens")) return;

  const aoTokens = (await PersistentStorage.get<TokenInfo[]>("ao_tokens")) || [];

  const updatedTokens = [...aoTokens];

  for (const token of aoTokens) {
    if (token.processId === AR_PROCESS_ID) continue;
    try {
      const tokenInfo = await timeoutPromise(getTokenInfo(token.processId), 6000);

      const updatedToken = {
        ...tokenInfo,
        lastUpdated: new Date().toISOString(),
      };

      if (updatedToken) {
        const index = updatedTokens.findIndex((t) => t.processId === token.processId);

        if (index !== -1) {
          updatedTokens[index] = { ...updatedTokens[index], ...updatedToken };
        }
      }
    } catch (err) {
      console.error(`Failed to update token with id ${token.processId}:`, err);
    }
  }
  await PersistentStorage.set("ao_tokens", updatedTokens);
};
