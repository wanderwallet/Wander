import { connect } from "@permaweb/aoconnect";
import { createDataItemSigner, getTagValue, Id, Owner, type TokenInfo } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { retryWithDelay } from "~utils/promises/retry";
import { getActiveAddress, getActiveKeyfile, type DecryptedWallet } from "~wallets";
import type { FlpTokenInfo } from "./fair_launch.types";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import { queryClient } from "~utils/tanstack";
import BigNumber from "bignumber.js";

const FAIR_LAUNCH_TOKENS_URL =
  "https://cdn.jsdelivr.net/gh/wanderwallet/wander-data@chore/update-auto-claim/tokens/flp-tokens.min.json";

const FAIR_LAUNCH_PROCESS_ID = "cuxSKjGJ-WDB9PzSkVkVVrIBSh3DrYHYz44usQOj5yE";

export async function getFairLaunchTokens<T extends boolean = false>(
  options: { forImport?: T } = {},
): Promise<T extends true ? TokenInfo[] : FlpTokenInfo[]> {
  try {
    const response = await retryWithDelay(() => fetch(FAIR_LAUNCH_TOKENS_URL, { cache: "no-cache" }));
    if (!response.ok) throw new Error(`Failed to fetch tokens: ${response.status}`);

    const flpTokens = await response.json();
    const { forImport = false } = options;

    return flpTokens.map((token: any) => ({
      Name: token.Name || token.name,
      Ticker: token.Ticker || token.ticker,
      Denomination: token.Denomination || token.denomination,
      Logo: token.Logo || token.logo,
      processId: token.Id || token.id,
      type: "asset",
      ...(forImport ? {} : { flpId: token.flpId, autoClaim: token.autoClaim }),
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
    process: FAIR_LAUNCH_PROCESS_ID,
    tags: [
      { name: "Action", value: "Get-Delegations" },
      { name: "Wallet", value: address },
    ],
  });

  const message = dryrunRes.Messages?.[0];
  const data = JSON.parse(message?.Data || "[]");

  // const factor = +(delegationInfo?.totalFactor || "10000") / 100;
  const delegationPrefs = data?.delegationPrefs || [];

  const delegationInfo = delegationPrefs.reduce((acc: any, pref: any) => {
    acc[pref.walletTo] = pref.factor / 100;
    return acc;
  }, {}) as Record<string, number>;

  const restDelegations = Object.entries(delegationInfo).reduce((acc: number, [key, value]) => {
    if (key !== address) {
      return acc + value;
    }
    return acc;
  }, 0);

  delegationInfo[address] = 100 - restDelegations;

  return delegationInfo;
}

export async function updateDelegationInfo(delegationInfo: Record<string, number>, address: string) {
  let decryptedWallet: DecryptedWallet;
  try {
    const aoInstance = connect(defaultConfig);

    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);

    Object.entries(delegationInfo).forEach(async ([key, value]) => {
      await aoInstance.message({
        process: FAIR_LAUNCH_PROCESS_ID,
        tags: [{ name: "Action", value: "Set-Delegation" }],
        signer,
        data: JSON.stringify({
          walletFrom: address,
          walletTo: key,
          factor: value * 100,
        }),
      });
    });

    await queryClient.invalidateQueries({ queryKey: ["ao-delegation-info", address] });
  } finally {
    if (decryptedWallet && decryptedWallet.type !== "hardware") {
      // Free the keyfile from memory
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}

export async function getClaimableBalance(token: FlpTokenInfo, recipient: string) {
  const aoInstance = connect(defaultConfig);

  const dryrunRes = await aoInstance.dryrun({
    Id,
    Owner,
    process: token.flpId,
    tags: [
      { name: "Action", value: "Get-Claimable-Balance" },
      { name: "Recipient", value: recipient },
    ],
  });

  const message = dryrunRes.Messages?.[0];
  const tags = message?.Tags || [];
  const balance = getTagValue("Balance", tags) || "0";

  return BigNumber(balance).shiftedBy(-token.Denomination).toFixed();
}

export async function claimBalance(flpId: string, tokenId: string) {
  let decryptedWallet: DecryptedWallet;
  try {
    const activeAddress = await getActiveAddress();
    const aoInstance = connect(defaultConfig);

    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);

    await aoInstance.message({
      process: flpId,
      tags: [{ name: "Action", value: "Withdraw-FLP-Token" }],
      signer,
    });

    await queryClient.invalidateQueries({ queryKey: ["claimable-balance", flpId, activeAddress] });
    await queryClient.invalidateQueries({ queryKey: ["tokenBalance", tokenId, activeAddress] });

    // TODO: add token to token list if not already in the list
  } finally {
    if (decryptedWallet && decryptedWallet.type !== "hardware") {
      // Free the keyfile from memory
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}
