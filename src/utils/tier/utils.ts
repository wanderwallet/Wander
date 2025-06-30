import { dryrun } from "@permaweb/aoconnect/browser";
import { Id } from "~tokens/aoTokens/ao";
import { TIER_PROCESS_ID } from "./constants";
import type { ActiveTier } from "./types";

export async function getActiveTier(walletAddress: string): Promise<ActiveTier> {
  const dryrunRes = await dryrun({
    Id,
    Owner: walletAddress,
    process: TIER_PROCESS_ID,
    tags: [{ name: "Action", value: "Get-Wallet-Tier" }],
  });

  const message = dryrunRes.Messages?.[0];
  const data = JSON.parse(message?.Data || "{}");
  return data;
}
