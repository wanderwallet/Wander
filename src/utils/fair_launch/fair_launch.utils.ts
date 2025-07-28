import { connect } from "@permaweb/aoconnect";
import { Id, Owner } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { retryWithDelay } from "~utils/promises/retry";
import { getActiveAddress } from "~wallets";
import type { FlpTokenInfo } from "./fair_launch.types";

const FAIR_LAUNCH_TOKENS_URL =
  "https://cdn.jsdelivr.net/gh/wanderwallet/wander-data@chore/update-flp-tokens/tokens/flp-tokens.min.json";

export async function getFairLaunchTokens(): Promise<FlpTokenInfo[]> {
  try {
    const response = await retryWithDelay(() => fetch(FAIR_LAUNCH_TOKENS_URL));
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.status}`);
    }

    const flpTokens = await response.json();

    return flpTokens.map((token: any) => ({
      Name: token.Name || token.name,
      Ticker: token.Ticker || token.ticker,
      Denomination: token.Denomination || token.denomination,
      Logo: token.Logo || token.logo,
      processId: token.Id || token.id,
      flpId: token.FlpId || token.flpId,
      type: "asset",
    }));
  } catch {
    return [];
  }
}

export async function getDelegationInfo(address?: string): Promise<Record<string, number>> {
  address = address || (await getActiveAddress());

  const aoInstance = connect(defaultConfig);

  const dryrunRes = await aoInstance.dryrun({
    Id,
    Owner,
    process: "cuxSKjGJ-WDB9PzSkVkVVrIBSh3DrYHYz44usQOj5yE",
    tags: [
      { name: "Action", value: "Get-Delegations" },
      { name: "Wallet", value: address },
    ],
  });

  const message = dryrunRes.Messages?.[0];
  const delegationInfo = JSON.parse(message?.Data || "[]");

  const factor = +(delegationInfo?.totalFactor || "10000") / 100;
  const delegationPrefs = delegationInfo?.delegationPrefs || [];

  return delegationPrefs.reduce((acc: any, pref: any) => {
    acc[pref.walletTo] = pref.factor / factor;
    return acc;
  }, {});
}
