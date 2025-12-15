import { connect } from "@permaweb/aoconnect";
import { createDataItemKeystoneSigner, createDataItemSigner, getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { retryWithDelay } from "~utils/promises/retry";
import { getActiveAddress, getActiveKeyfile, type DecryptedWallet } from "~wallets";
import type { FlpTokenInfo } from "./fair_launch.types";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import { queryClient } from "~utils/tanstack";
import BigNumber from "bignumber.js";
import { CACHE_API } from "~constants/api";
import { getAoTokens } from "~tokens";
import { ExtensionStorage } from "~utils/storage";
import { LOG_GROUP, log } from "~utils/log/log.utils";
import { PI_FLP_ID } from "./fair_launch.constants";
import { KeystoneSigner } from "~wallets/hardware/keystone";
import { Id, Owner, WNDR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";

interface RawFlpToken {
  flp_token_name: string;
  flp_token_ticker: string;
  flp_token_denomination: number;
  flp_token_logo: string;
  flp_token_process: string;
  flp_id: string;
}

interface FlpToken {
  name: string;
  ticker: string;
  denomination: number;
  logo: string;
  id: string;
  flpId: string;
  autoClaim: boolean;
}

type DelegationRecord = Record<string, number>;

const FAIR_LAUNCH_TOKENS_URL = `${CACHE_API}/api/flp-tokens`;
const FLP_DELEGATION_PROCESS_ID = "cuxSKjGJ-WDB9PzSkVkVVrIBSh3DrYHYz44usQOj5yE";
const FLP_AO_DELEGATION_TRACKER_PROCESS_ID = "NRP0xtzeV9MHgwLmgD254erUB7mUjMBhBkYkNYkbNEo";
const FLP_REGISTRY_PROCESS_ID = "It-_AKlEfARBmJdbJew1nG9_hIaZt0t20wQc28mFGBE";
const ONE_HOUR_MS = 1000 * 60 * 60;

/**
 * Test token FLP IDs that should be filtered out from the results.
 * These are test tokens that should not appear in the results.
 */
const TEST_TOKEN_FLP_IDS = new Set([
  "T3M4QSF7VGa0le7KtxBDHOaIcjnZeC-SQ7nh3ABuufs",
  "So2HpldZaaVFbeH8mUGGzQBVdEzAx5HvMyMaZ47az_M",
  "4mowY7A-b6WJyVR-Tde2m3Zcl_JVxil21c15PXiHhfA",
  "-ntvNGm4onpKXS8SZ6-5sFnmjRHfMNAwS_JuR-pO504",
  "WRkDu1hOeNksAlli1R4LUUh674Q79DjSOSegdIiI68U",
  "c0-R2wvW1yRnRjQdUqetgD9tDJSCGpeJjz1HthfXwQ8",
  "wsT2snFHYQ7AX7OxnrFViyu4v5il6sIb9EYxTnBnMQc",
  "FyQ9uMx1XevItG1kE65BMvbbqcvdOGJrC_nb-PPIawk",
  "xswbZRtkjQQ8D1h6tx503iLaAxxPLWP10J2TvgbRZXk",
  "NQy9H6oAE-m55BheXbGu70nEWiiGMsL8lM9YsNJ8gD4",
  "gkcnuAZeFeqPvFvNABFKGRKGE_AsmA0T3I1_jOFF0MU",
  "Gmf5PyNLd1R4uENH2ITg03KxKMi25g1ZJl1F6AplQRc",
  // LLAMA REBORN
  "ybJns4GXaCfXifPoJAXTGjSaeU24DL18OpaKTQ89xe0",
  "MH2WTdN3de3XKYyQ_Yufx-y-YkqV_57yPNKP4n1_3t8",
  "GDiWVCFSaOngnyp17xM5VX-jqofYKBN6c1vNBnz02hw",
  "nBqlzp2lSU_ciociG2OrTxjDfzA_nfhttv4qqyylMn4",
  "_L_GMvgax750A8oORtNPetcmq5fog3K6WtvY4PFpipo",
]);

/**
 * Manual claimable token FLP IDs that require manual intervention for claiming rewards.
 * These tokens do not support auto-claim functionality and must be claimed manually by users.
 */
const MANUAL_CLAIMABLE_FLP_IDS = new Set([
  "NXZjrPKh-fQx8BUCG_OXBUtB4Ix8Xf0gbUtREFoWQ2Q", // ACTION Token
  "rW7h9J9jE2Xp36y4SKn2HgZaOuzRmbMfBRPwrFFifHE", // AR.IO Token
  "3eZ6_ry6FD9CB58ImCQs6Qx_rJdDUGhz-D2W1AqzHD8", // PIXL Token
  "Wc8Rg-owsWSvrmb5XAlmSs3_4UtHo9i5ui2o9UCFuTk", // Protocol Land
]);

const aoInstance = connect({ ...defaultConfig, CU_URL: "https://cu-af.dataos.so" });

/**
 * Get the total delegation of AO by project.
 * This is used to sort the flp tokens by the total delegation of AO.
 */
async function getTotalAODelegationByProject(): Promise<DelegationRecord> {
  try {
    const result = await retryWithDelay(() =>
      aoInstance.dryrun({
        process: FLP_AO_DELEGATION_TRACKER_PROCESS_ID,
        tags: [{ name: "Action", value: "Get-Total-Delegated-AO-By-Project" }],
      }),
    );

    const data = result?.Messages[0]?.Data ?? "{}";
    const totalDelegatedAOByProject = JSON.parse(data);
    return totalDelegatedAOByProject?.combined ?? {};
  } catch {
    return {};
  }
}

/**
 * Fetches FLP tokens from AO registry, filters test tokens, and sorts by delegation amount.
 */
async function getFlpTokensFromAo(): Promise<FlpToken[]> {
  const result = await retryWithDelay(() =>
    aoInstance.dryrun({
      process: FLP_REGISTRY_PROCESS_ID,
      tags: [{ name: "Action", value: "Get-FLPs" }],
    }),
  );

  const data = result?.Messages[0]?.Data ?? "{}";
  const rawFlpTokens: RawFlpToken[] = JSON.parse(data);

  const totalAODelegationByProject = await getTotalAODelegationByProject();

  const flpTokens = rawFlpTokens
    .map((token: RawFlpToken): FlpToken => {
      return {
        id: token.flp_token_process,
        flpId: token.flp_id,
        name: token.flp_token_name,
        ticker: token.flp_token_ticker,
        denomination: +token.flp_token_denomination,
        logo: token.flp_token_logo,
        autoClaim: !MANUAL_CLAIMABLE_FLP_IDS.has(token.flp_id),
      };
    })
    .filter(
      (token: FlpToken): boolean =>
        token.id !== undefined &&
        !!token.name &&
        !!token.ticker &&
        !isNaN(token.denomination) &&
        !TEST_TOKEN_FLP_IDS.has(token.flpId),
    )
    .sort((a: FlpToken, b: FlpToken): number => {
      if (a.id === WNDR_PROCESS_ID) return -1;
      if (b.id === WNDR_PROCESS_ID) return 1;
      return (totalAODelegationByProject[b.flpId] ?? 0) - (totalAODelegationByProject[a.flpId] ?? 0);
    });

  return flpTokens;
}

export async function getFairLaunchTokens<T extends boolean = false>(
  options: { forImport?: T } = {},
): Promise<T extends true ? TokenInfo[] : FlpTokenInfo[]> {
  try {
    let flpTokens: FlpToken[] = [];

    const cachedTokens = await ExtensionStorage.get<{
      tokens: FlpToken[];
      timestamp: number;
    }>("fair_launch_tokens");

    if (cachedTokens && cachedTokens.timestamp && Date.now() - cachedTokens.timestamp < ONE_HOUR_MS) {
      flpTokens = cachedTokens.tokens;
    } else {
      try {
        const response = await retryWithDelay(() => fetch(FAIR_LAUNCH_TOKENS_URL));
        if (!response.ok) throw new Error(`Failed to fetch tokens: ${response.status}`);

        ({ flpTokens } = await response.json());
      } catch {
        flpTokens = await getFlpTokensFromAo();
      }

      if (flpTokens.length > 0) {
        // Cache for 1 hour
        await ExtensionStorage.set("fair_launch_tokens", {
          tokens: flpTokens,
          timestamp: Date.now(),
        });
      }
    }

    const { forImport = false } = options;

    const flpTokenInfos = flpTokens.map((token: FlpToken) => ({
      Name: token.name,
      Ticker: token.ticker,
      Denomination: token.denomination,
      Logo: token.logo,
      processId: token.id,
      type: "asset",
      ...(forImport ? {} : { flpId: token.flpId, autoClaim: token.autoClaim }),
    }));

    return flpTokenInfos as T extends true ? TokenInfo[] : FlpTokenInfo[];
  } catch {
    return [];
  }
}

export async function getDelegationInfo(address?: string): Promise<Record<string, number>> {
  address = address || (await getActiveAddress());

  const dryrunRes = await aoInstance.dryrun({
    Id,
    Owner,
    process: FLP_DELEGATION_PROCESS_ID,
    tags: [
      { name: "Action", value: "Get-Delegations" },
      { name: "Wallet", value: address },
    ],
  });

  const message = dryrunRes.Messages?.[0];
  const data = JSON.parse(message?.Data || "[]");

  // const factor = +(delegationInfo?.totalFactor || "10000") / 100;
  const delegationPrefs = data?.delegationPrefs || [];

  if (delegationPrefs.length === 0) return { [PI_FLP_ID]: 100 };

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

export async function updateDelegationInfo(
  delegationInfo: Record<string, number>,
  address: string,
  keystoneSigner?: KeystoneSigner,
) {
  let decryptedWallet: DecryptedWallet;
  let dataItemSigner: KeystoneSigner | ReturnType<typeof createDataItemSigner>;

  try {
    const aoInstance = connect(defaultConfig);
    decryptedWallet = await getActiveKeyfile();

    if (!keystoneSigner || decryptedWallet.type === "local") {
      isLocalWallet(decryptedWallet);
      dataItemSigner = createDataItemSigner(decryptedWallet.keyfile);
    } else {
      dataItemSigner = createDataItemKeystoneSigner(keystoneSigner);
    }

    const delegationInfoArray = Object.entries(delegationInfo);
    delegationInfoArray.sort(([key1]) => (key1 === address ? -1 : 1));

    for (const [key, value] of delegationInfoArray) {
      await aoInstance.message({
        process: FLP_DELEGATION_PROCESS_ID,
        tags: [{ name: "Action", value: "Set-Delegation" }],
        signer: dataItemSigner as any,
        data: JSON.stringify({
          walletFrom: address,
          walletTo: key,
          factor: value * 100,
        }),
      });
    }

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

export async function claimBalance(token: FlpTokenInfo) {
  let decryptedWallet: DecryptedWallet;
  try {
    const activeAddress = await getActiveAddress();
    const aoInstance = connect(defaultConfig);

    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);

    await aoInstance.message({
      process: token.flpId,
      tags: [{ name: "Action", value: "Withdraw-FLP-Token" }],
      signer,
    });

    await queryClient.invalidateQueries({ queryKey: ["claimable-balance", token.flpId, activeAddress] });
    await queryClient.invalidateQueries({ queryKey: ["tokenBalance", token.processId, activeAddress] });

    // import the token if not already in the list
    await importFlpToken(token);
  } finally {
    if (decryptedWallet && decryptedWallet.type !== "hardware") {
      // Free the keyfile from memory
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}

const importFlpToken = async (token: FlpTokenInfo) => {
  try {
    // Validate required fields first before doing any async operations
    if (!token.Name || !token.Ticker || isNaN(+token.Denomination)) return;

    const aoTokens = await getAoTokens();
    if (aoTokens.some(({ processId }) => processId === token.processId)) return;

    const tokenToImport: TokenInfo = {
      Name: token.Name,
      Ticker: token.Ticker,
      Denomination: token.Denomination,
      Logo: token.Logo,
      processId: token.processId,
      type: "asset",
    };

    aoTokens.push(tokenToImport);

    await ExtensionStorage.set("ao_tokens", aoTokens);
  } catch {
    log(LOG_GROUP.FAIR_LAUNCH, "Error importing fair launch token: ", token);
  }
};
