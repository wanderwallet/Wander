import { ExtensionStorage } from "~utils/storage";
import type { TokenInfoWithProcessId } from "./aoTokens/ao";

/**
 * Get stored ao tokens
 */
export async function getAoTokens() {
  const tokens = await ExtensionStorage.get<TokenInfoWithProcessId[]>(
    "ao_tokens"
  );

  return tokens || [];
}

/**
 * Get stored ao tokens cache
 */
export async function getAoTokensCache() {
  const tokens = await ExtensionStorage.get<TokenInfoWithProcessId[]>(
    "ao_tokens_cache"
  );

  return tokens || [];
}

/**
 * Get stored ao tokens removed ids
 */
export async function getAoTokensAutoImportRestrictedIds() {
  const removedIds = await ExtensionStorage.get<string[]>(
    "ao_tokens_auto_import_restricted_ids"
  );

  return removedIds || [];
}

/**
 * Remove a token from stored tokens
 *
 * @param id ID of the token contract
 */
export async function removeToken(id: string) {
  const aoTokens = await getAoTokens();

  if (aoTokens.some((token) => token.processId === id)) {
    const restrictedTokenIds = await getAoTokensAutoImportRestrictedIds();
    if (!restrictedTokenIds.includes(id)) {
      restrictedTokenIds.push(id);
      await ExtensionStorage.set(
        "ao_tokens_auto_import_restricted_ids",
        restrictedTokenIds
      );
    }
    await ExtensionStorage.set(
      "ao_tokens",
      aoTokens.filter((token) => token.processId !== id)
    );
  }
}

export async function removeAoToken(id: string) {
  const tokens = await getAoTokens();
  const updatedTokens = tokens.filter((token) => token.processId !== id);
  await ExtensionStorage.set("ao_tokens", updatedTokens);
}
