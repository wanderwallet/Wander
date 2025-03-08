import Arweave from "arweave";
import type { Alarms } from "webextension-polyfill";
import {
  getAoTokens,
  getAoTokensCache,
  getAoTokensAutoImportRestrictedIds
} from "~tokens";
import { getTokenInfo } from "~tokens/aoTokens/router";
import {
  AO_TOKENS,
  AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS,
  AO_TOKENS_IMPORT_TIMESTAMP,
  gateway,
  getNoticeTransactions,
  verifyCollectiblesType
} from "~tokens/aoTokens/sync";
import { withRetry } from "~utils/promises/retry";
import { timeoutPromise } from "~utils/promises/timeout";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";

/**
 *  Import AO Tokens
 */
export async function handleAoTokensImportAlarm(alarm: Alarms.Alarm) {
  if (alarm?.name !== "import_ao_tokens") return;

  try {
    const activeAddress = await getActiveAddress();

    let [aoTokens, aoTokensCache, removedTokenIds = []] = await Promise.all([
      getAoTokens(),
      getAoTokensCache(),
      getAoTokensAutoImportRestrictedIds()
    ]);

    let aoTokensIds = new Set(aoTokens.map(({ processId }) => processId));
    const aoTokensCacheIds = new Set(
      aoTokensCache.map(({ processId }) => processId)
    );
    let tokenIdstoExclude = new Set([...aoTokensIds, ...removedTokenIds]);
    const walletTokenIds = new Set([...tokenIdstoExclude, ...aoTokensCacheIds]);

    const arweave = new Arweave(gateway);
    const { processIds } = await getNoticeTransactions(
      arweave,
      activeAddress,
      Array.from(walletTokenIds)
    );

    const newProcessIds = Array.from(
      new Set([...processIds, ...aoTokensCacheIds])
    ).filter((processId) => !tokenIdstoExclude.has(processId));

    if (newProcessIds.length === 0) {
      console.log("No new ao tokens found!");
      return;
    }

    const promises = newProcessIds
      .filter((processId) => !aoTokensCacheIds.has(processId))
      .map((processId) =>
        withRetry(async () => {
          const token = await timeoutPromise(getTokenInfo(processId), 3000);
          return { ...token, processId };
        }, 2)
      );
    const results = await Promise.allSettled(promises);

    const tokens = [];
    const tokensToRestrict = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const token = result.value;
        if (token.Ticker) {
          tokens.push(token);
        } else if (!removedTokenIds.includes(token.processId)) {
          tokensToRestrict.push(token);
        }
      }
    });

    const updatedTokens = [...aoTokensCache, ...tokens];

    aoTokens = await getAoTokens();
    aoTokensIds = new Set(aoTokens.map(({ processId }) => processId));
    tokenIdstoExclude = new Set([...aoTokensIds, ...removedTokenIds]);

    if (tokensToRestrict.length > 0) {
      removedTokenIds.push(
        ...tokensToRestrict.map(({ processId }) => processId)
      );
      await ExtensionStorage.set(
        AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS,
        removedTokenIds
      );
    }

    let newTokens = updatedTokens.filter(
      (token) => !tokenIdstoExclude.has(token.processId)
    );
    if (newTokens.length === 0) return;

    // Verify collectibles type
    newTokens = await verifyCollectiblesType(newTokens, arweave);

    newTokens.forEach((token) => aoTokens.push(token));
    await ExtensionStorage.set(AO_TOKENS, aoTokens);

    console.log("Imported ao tokens!");
  } catch (error: any) {
    console.log("Error importing tokens: ", error?.message);
  } finally {
    await ExtensionStorage.set(AO_TOKENS_IMPORT_TIMESTAMP, 0);
  }
}
