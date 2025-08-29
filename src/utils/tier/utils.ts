import { dryrun, message } from "@permaweb/aoconnect/browser";
import { createDataItemSigner, getTagValue } from "~tokens/aoTokens/ao";
import { tierIdToTierName, TIER_PROCESS_ID } from "./constants";
import type { ActiveTier, ActiveTierFromApi, DefiFeeDetails, Tier, WalletSavings } from "./types";
import { defiFeePercent, defiFeeReductionsInPercent } from "./constants";
import BigNumber from "bignumber.js";
import { getKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { isLocalWallet } from "~utils/assertions";
import { ExtensionStorage } from "~utils/storage";
import { scheduleRefreshWalletLifetimeSavings } from "./alarms";
import { retryWithDelay } from "~utils/promises/retry";
import { Id } from "~tokens/aoTokens/ao.constants";
import { CACHE_API } from "~constants/api";

const ONE_HUNDRED = BigNumber(100);
const THREE_HOURS_MS = 10_800_000;
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export async function getWalletLifetimeSavingsFromStorage(walletAddress: string) {
  return ExtensionStorage.get<WalletSavings>(`wallet_lifetime_savings_${walletAddress}`);
}

export async function saveWalletLifetimeSavingsToStorage(walletAddress: string, feeSavings: string, fresh?: boolean) {
  await ExtensionStorage.set(`wallet_lifetime_savings_${walletAddress}`, {
    lifetimeSavings: feeSavings,
    fresh: fresh ?? true,
    lastUpdated: Date.now(),
  });
}

function isValidTierInfo(data: ActiveTierFromApi): data is ActiveTierFromApi {
  return (
    data &&
    typeof data === "object" &&
    typeof data.tier === "number" &&
    typeof data.balance === "string" &&
    (typeof data.rank === "number" || data.rank === "") &&
    typeof data.progress === "number" &&
    typeof data.snapshotTimestamp === "number" &&
    typeof data.totalHolders === "number"
  );
}

export async function getActiveTier(walletAddress: string, retry = false): Promise<ActiveTier> {
  const savedActiveTier = await ExtensionStorage.get<ActiveTier>(`active_tier_${walletAddress}`);

  if (
    savedActiveTier &&
    savedActiveTier?.snapshotTimestamp &&
    savedActiveTier?.snapshotTimestamp + ONE_DAY_MS > Date.now()
  ) {
    return savedActiveTier;
  }

  let data: ActiveTierFromApi;

  try {
    const response = await fetch(`${CACHE_API}/api/tier-info?address=${walletAddress}`);
    if (!response.ok) {
      throw new Error("Failed to fetch tier info from cache API");
    }

    const responseData = await response.json();

    if (!isValidTierInfo(responseData)) {
      throw new Error("Invalid tier info data format from cache API");
    }

    data = responseData;
  } catch {
    const dryrunParams = {
      Id,
      Owner: walletAddress,
      process: TIER_PROCESS_ID,
      tags: [{ name: "Action", value: "Get-Wallet-Info" }],
    };

    const dryrunRes = retry
      ? await retryWithDelay(
          () => dryrun(dryrunParams),
          3,
          1000,
          (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        )
      : await dryrun(dryrunParams);

    const message = dryrunRes.Messages?.[0];
    const parsedData = JSON.parse(message?.Data || "{}");

    if (!isValidTierInfo(parsedData)) {
      throw new Error("Invalid tier info data from WNDR tier process");
    }

    data = parsedData;
  }

  const activeTier = {
    ...data,
    tier: tierIdToTierName[data.tier],
  } satisfies ActiveTier;

  await ExtensionStorage.set(`active_tier_${walletAddress}`, activeTier);

  return activeTier;
}

export function getDefiFeeDetailsForTier(tier: Tier): DefiFeeDetails {
  const defiFeeReduction = BigNumber(defiFeeReductionsInPercent[tier]);
  const finalPercent = ONE_HUNDRED.minus(defiFeeReduction).multipliedBy(defiFeePercent).dividedBy(ONE_HUNDRED);

  return {
    originalFeePercent: defiFeePercent.toFixed(2),
    finalFeePercent: finalPercent.toFixed(2),
    feeHasChanged: !finalPercent.eq(defiFeePercent),
    tier,
  };
}

export async function getWalletLifetimeSavings(walletAddress: string): Promise<string> {
  const savedSavings = await getWalletLifetimeSavingsFromStorage(walletAddress);

  if (
    savedSavings &&
    savedSavings?.fresh &&
    savedSavings?.lifetimeSavings &&
    savedSavings?.lastUpdated + THREE_HOURS_MS > Date.now()
  ) {
    return savedSavings.lifetimeSavings;
  }

  const dryrunRes = await dryrun({
    Id,
    Owner: walletAddress,
    process: TIER_PROCESS_ID,
    tags: [{ name: "Action", value: "Get-Savings" }],
  });

  const message = dryrunRes.Messages?.[0];
  const tags = message?.Tags || [];
  const savings = getTagValue("Savings", tags) || "0";

  await saveWalletLifetimeSavingsToStorage(walletAddress, savings);

  return savings;
}

export async function saveWalletLifetimeSavings(walletAddress: string, savingsInUsd: string) {
  let decryptedWallet: DecryptedWallet;
  try {
    if (!walletAddress || !savingsInUsd || BigNumber(savingsInUsd).lte(0)) return;

    decryptedWallet = await getKeyfile(walletAddress);
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);
    const transferID = await message({
      process: TIER_PROCESS_ID,
      signer,
      tags: [
        { name: "Action", value: "Add-Savings" },
        { name: "Fee-Savings", value: savingsInUsd },
      ],
    });

    await scheduleRefreshWalletLifetimeSavings(walletAddress);

    return transferID;
  } catch {
    console.error("Error getting keyfile for wallet address: ", walletAddress);
    return;
  } finally {
    if (decryptedWallet && decryptedWallet.type !== "hardware") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}
