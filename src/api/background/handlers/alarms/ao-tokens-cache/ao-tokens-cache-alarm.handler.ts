import { dryrun } from "@permaweb/aoconnect";
import { PersistentStorage } from "~utils/storage";
import type { Alarms } from "webextension-polyfill";
import { AR_PROCESS_ID, Id, Owner, type TokenInfo, getTokenInfoFromData } from "~tokens/aoTokens/ao";
import { timeoutPromise } from "~utils/promises/timeout";

/**
 * Alarm handler for syncing ao tokens
 */
export const handleAoTokenCacheAlarm = async (alarmInfo?: Alarms.Alarm) => {
  if (alarmInfo && !alarmInfo.name.startsWith("update_ao_tokens")) return;

  const aoTokens = (await PersistentStorage.get<TokenInfo[]>("ao_tokens")) || [];

  const updatedTokens = [...aoTokens];

  for (const token of aoTokens) {
    if (token.processId === AR_PROCESS_ID) continue;
    try {
      const res = await timeoutPromise(
        dryrun({
          Id,
          Owner,
          process: token.processId,
          tags: [{ name: "Action", value: "Info" }],
        }),
        6000,
      );

      if (res.Messages && Array.isArray(res.Messages)) {
        const tokenInfo = getTokenInfoFromData(res, token.processId);
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
      }
    } catch (err) {
      console.error(`Failed to update token with id ${token.processId}:`, err);
    }
  }
  await PersistentStorage.set("ao_tokens", updatedTokens);
};
