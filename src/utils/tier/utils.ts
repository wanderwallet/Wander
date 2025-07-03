import { dryrun, message } from "@permaweb/aoconnect/browser";
import { AO_PROCESS_ID, createDataItemSigner, getBotegaPrice, getTagValue, Id } from "~tokens/aoTokens/ao";
import { TIER_PROCESS_ID } from "./constants";
import type { ActiveTier, DefiFeeDetails, Tier } from "./types";
import { defiFeePercent, defiFeeReductionsInPercent } from "./constants";
import BigNumber from "bignumber.js";
import { getKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { isLocalWallet } from "~utils/assertions";
import { balanceToFractioned } from "~tokens/currency";
import { queryClient } from "~utils/agents/utils";

const ONE_HUNDRED = BigNumber(100);

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

export function getDefiFeeDetailsForTier(tier: Tier): DefiFeeDetails {
  const defiFeeReduction = BigNumber(defiFeeReductionsInPercent[tier]);
  const finalPercent = ONE_HUNDRED.minus(defiFeeReduction).multipliedBy(defiFeePercent).dividedBy(ONE_HUNDRED);

  return {
    originalFeePercent: defiFeePercent.toFixed(2),
    finalFeePercent: finalPercent.toFixed(2),
    feeHasChanged: !finalPercent.eq(defiFeePercent),
  };
}

export async function getWalletSavings(walletAddress: string): Promise<string> {
  const dryrunRes = await dryrun({
    Id,
    Owner: walletAddress,
    process: TIER_PROCESS_ID,
    tags: [{ name: "Action", value: "Get-Savings" }],
  });

  const message = dryrunRes.Messages?.[0];
  const tags = message?.Tags || [];
  const savings = getTagValue("Savings", tags) || "0";
  return savings;
}

export async function saveWalletSavings(walletAddress: string, feeSavings: string) {
  let decryptedWallet: DecryptedWallet;
  try {
    if (!walletAddress || !feeSavings || BigNumber(feeSavings).lte(0)) return;

    let price = 0;

    const queryKey = ["tokenPrice", AO_PROCESS_ID];
    const existingPrice = queryClient.getQueryState(queryKey);
    if (!existingPrice?.data) {
      price = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => getBotegaPrice(AO_PROCESS_ID),
        staleTime: 0,
        retry: 3,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      });
    }

    if (+price <= 0) return;

    const feeSavingsAmount = balanceToFractioned(feeSavings, { decimals: 12 });
    const savingsInUsd = BigNumber(
      feeSavingsAmount.multipliedBy(price).toPrecision(8, BigNumber.ROUND_HALF_UP),
    ).toFixed();

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
