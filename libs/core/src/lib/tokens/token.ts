import { PersistentStorage } from "~utils/storage/storage";
import { type TokenInfo } from "./aoTokens/ao";
import { defaultTokens, AO_OLD_PROCESS_ID, AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";

export interface Token {
  id: string;
  name?: string;
  ticker: string;
  type: TokenType;
  hidden?: boolean;
  balance: string | null;
  divisibility?: number;
  decimals?: number;
  defaultLogo?: string;
}

export type TokenType = "asset" | "collectible";

export async function loadTokens() {
  // Load tokens or fall back to default tokens:
  let aoTokens = (await PersistentStorage.get<TokenInfo[]>("ao_tokens")) || defaultTokens;

  // Remove the old AO token if present:
  aoTokens = aoTokens.filter((token) => token.processId !== AO_OLD_PROCESS_ID);

  // If AR, AO or PI tokens are not already in the list, add them:

  const existingProcessIds = new Set(aoTokens.map((token) => token.processId));

  const requiredTokens = [
    defaultTokens[4], // USDA
    defaultTokens[2], // PI
    defaultTokens[3], // WNDR
    defaultTokens[1], // AO
    defaultTokens[0], // AR
  ];

  requiredTokens.forEach((requiredToken) => {
    if (!existingProcessIds.has(requiredToken.processId)) {
      aoTokens.unshift(requiredToken);
    }
  });

  // Previously, the AR token name was "AR" instead of "Arweave".
  // This is a fix to ensure the token name is "Arweave" in the UI.
  const arToken = aoTokens.find((t) => t.processId === AR_PROCESS_ID);
  if (arToken?.Name === "AR") {
    arToken.Name = "Arweave";
  }

  await PersistentStorage.set("ao_tokens", aoTokens);
}
