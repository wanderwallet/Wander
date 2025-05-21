import type { DisplayTheme } from "@arconnect/components";
import { concatGatewayURL } from "~gateways/utils";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { findGateway } from "~gateways/wayfinder";
import { PersistentStorage } from "~utils/storage";
import { defaultTokens, type TokenInfoWithProcessId } from "./aoTokens/ao";
import { AO_NATIVE_OLD_TOKEN } from "~utils/ao_import";

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

/**
 * Load token logo from Viewblock. If no logo
 * is returned, return the original logo from
 * the contract.
 *
 * @param id Contract ID of the token
 * @param defaultLogo Default logo tx ID in the contract state
 * @param theme UI theme to match the logo with
 */
export async function loadTokenLogo(id: string, defaultLogo?: string, theme?: DisplayTheme) {
  // find gateway with wayfinder
  const gateway = await findGateway({ startBlock: 0 });

  // get token logo from settings
  if (defaultLogo) {
    return `${concatGatewayURL(gateway)}/${defaultLogo}`;
  }

  try {
    // try to see if the token logo is the data
    // of the token contract creation transaction
    const res = await fetch(`${concatGatewayURL(gateway)}/${id}`);
    const contentType = res.headers.get("content-type");

    if (!contentType.includes("image")) {
      throw new Error();
    }

    return URL.createObjectURL(await res.blob());
  } catch {
    // if there are no logos in settings, return the AR logo
    return theme === "dark" ? arLogoLight : arLogoDark;
  }
}

export async function loadTokens() {
  // Load tokens or fall back to default tokens:
  let aoTokens = (await PersistentStorage.get<TokenInfoWithProcessId[]>("ao_tokens")) || defaultTokens;

  // Remove the old AO token if present:
  aoTokens = aoTokens.filter((token) => token.processId !== AO_NATIVE_OLD_TOKEN);

  // If AR, AO or PI tokens are not already in the list, add them:

  const existingProcessIds = new Set(aoTokens.map((token) => token.processId));

  const requiredTokens = [
    defaultTokens[2], // PI
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
