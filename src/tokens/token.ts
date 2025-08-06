import { PersistentStorage } from "~utils/storage";
import { AO_OLD_PROCESS_ID, defaultTokens, type TokenInfo } from "./aoTokens/ao";

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

  await PersistentStorage.set("ao_tokens", aoTokens);
}
