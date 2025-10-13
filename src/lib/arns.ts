import {
  ANT,
  AOProcess,
  ARIO,
  ARIO_MAINNET_PROCESS_ID,
  ArweaveSigner,
  mARIOToken,
  type AoANTInfo,
  type AoANTState,
  type AoArNSNameData,
  type AoArNSNameDataWithName,
  type AoPrimaryName,
  type AoRegistrationFees,
  type PaginationParams,
  type WalletAddress,
} from "@ar.io/sdk/web";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { useMemo } from "react";
import type { PurchaseType } from "~routes/popup/arns/types";
import { decodeDomainToASCII, lowerCaseDomain } from "~routes/popup/arns/utils";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import { useTokenBalance } from "~tokens/hooks";
import { isLocalWallet } from "~utils/assertions";
import { createExtensionStoragePersister } from "~utils/query/createExtensionStoragePersister";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { useActiveAddress, useActiveWallet } from "~wallets/hooks";
import type { NameServiceProfile } from "./types";
import { useActiveTier } from "~utils/tier/hooks";
import { tierNameToId, TierTypes } from "~utils/tier/constants";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { cuAoInstance } from "~utils/aoconnect";

export const LANDING_PAGE_TXID = "oork_YifB3-JQQZg8EgMPQJytua_QCHKNmMqt5kmnCo";
export const DEFAULT_ANT_LOGO = "Sie_26dvgyok0PZD_-iQAFOhOd5YxDTkczOLoqTTL_A";

// ArNS purchase disabled for lower tiers until Sept 30th 2025 GMT
const ARNS_PURCHASE_DISABLED_FOR_LOWER_TIERS = Date.now() < Date.parse("2025-09-30T00:00:00+00:00");
const RESERVE_TIER_ID = 3;

// Query client for ArNS profile caching
export const ARNS_QUERY_CLIENT = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create and set up the persister for ARNS
const arnsPersister = createExtensionStoragePersister({
  cacheKey: "arns-cache",
});

// Use it with persistQueryClient
persistQueryClient({
  queryClient: ARNS_QUERY_CLIENT,
  persister: arnsPersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  buster: "v1",
});

export const ARIO_PROCESS_ID = process.env.PLASMO_PUBLIC_ARIO_PROCESS_ID ?? ARIO_MAINNET_PROCESS_ID;

export const ARIO_READ_SDK = ARIO.init({
  process: new AOProcess({
    processId: ARIO_PROCESS_ID,
    ao: cuAoInstance,
  }),
});

// UTILITY FOR STALE TIME

const EPOCH_ZERO_TIMESTAMP = 1741176000000; // ms
const EPOCH_LENGTH_MS = 86_400_000; // 24h in ms

/**
 * Calculates the stale time (in ms) until the next epoch begins.
 * @param nowMs Current timestamp in ms (default: Date.now()).
 * @returns Number of ms remaining until the next epoch.
 */
function calculateStaleTimeFromEpochZeroTimestamp(nowMs: number = Date.now()): number {
  const elapsedSinceEpochZero = nowMs - EPOCH_ZERO_TIMESTAMP;
  const msIntoCurrentEpoch = elapsedSinceEpochZero % EPOCH_LENGTH_MS;
  const msUntilNextEpoch = EPOCH_LENGTH_MS - msIntoCurrentEpoch;
  // add 10 second buffer to ensure we are in the next epocho esnure we are in the next epoch
  return msUntilNextEpoch + 10_000;
}

///

export async function getArNSRecord(name: string): Promise<AoArNSNameData | undefined> {
  const record = await ARIO_READ_SDK.getArNSRecord({ name });
  return record;
}

export async function getANTInfo(processId: string): Promise<AoANTInfo> {
  const ant = ANT.init({
    process: new AOProcess({ processId, ao: cuAoInstance }),
  });

  return ant.getInfo();
}

export async function getANTState(processId: string): Promise<AoANTState> {
  const ant = ANT.init({
    process: new AOProcess({ processId, ao: cuAoInstance }),
  });

  return ant.getState();
}

export async function searchArNSName(name: string) {
  name = name.toLowerCase();
  const record = await getArNSRecord(name);

  if (record?.processId) {
    const info = await getANTInfo(record?.processId);

    return {
      success: true,
      record: { ...record, owner: info.Owner },
    };
  }
  return {
    success: false,
    record: null,
  };
}

/**
 * Generalized method to find the logo (avatar) for an ArNS name.
 * Fetches the ArNS record and ANT info to retrieve the transaction ID for the logo.
 * @param primaryName - The ArNSPrimaryName to fetch the logo for.
 * @returns The transaction ID of the logo if found, otherwise undefined.
 */
export async function findLogo(primaryName: AoPrimaryName): Promise<string | undefined> {
  try {
    // Fetch the ANT info to get the logo transaction ID
    const antInfo = await getANTState(primaryName.processId);
    return antInfo?.Logo;
  } catch (error) {
    console.error(`Failed to fetch logo for name ${primaryName.name}:`, error);
    return undefined;
  }
}

/**
 * Fetches the primary ArNS name for a wallet address.
 * @param address - Wallet address to fetch the primary name for.
 * @returns Primary name record or undefined.
 */
async function getPrimaryArNSName(address: string): Promise<AoPrimaryName | undefined> {
  return ARIO_READ_SDK.getPrimaryName({ address });
}

async function fetchArNSProfile(walletAddress: string): Promise<NameServiceProfile | null> {
  if (!walletAddress) {
    return null;
  }

  try {
    // Fetch the primary name and logo
    const primaryName = await getPrimaryArNSName(walletAddress);
    const logo = await findLogo(primaryName);

    return {
      address: walletAddress,
      name: decodeDomainToASCII(primaryName?.name),
      logo,
    };
  } catch (error) {
    console.error("Error fetching ArNS profile:", error);
    throw error;
  }
}

export async function getArNSProfile(walletAddress: string): Promise<NameServiceProfile | undefined> {
  if (!walletAddress) {
    return undefined;
  }

  try {
    const result = await ARNS_QUERY_CLIENT.fetchQuery({
      queryKey: ["arns-profile", walletAddress],
      queryFn: () => fetchArNSProfile(walletAddress),
      staleTime: 60 * 60 * 1000, // 1 hour
    });

    return result;
  } catch (error) {
    console.error(`Unexpected error in getArNSProfile for ${walletAddress}:`, error);
    return undefined;
  }
}

async function getTicker() {
  try {
    const info = await ARIO_READ_SDK.getInfo();
    return info.Ticker;
  } catch (error) {
    console.error("Error fetching ARIO ticker:", error);
    return "ARIO";
  }
}

/** Hook for getting ARIO Ticker */
export function useTicker() {
  return useQuery(
    {
      queryKey: ["ario-ticker", ARIO_PROCESS_ID],
      queryFn: getTicker,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      placeholderData: "ARIO",
    },
    ARNS_QUERY_CLIENT,
  );
}

export function isArNSNameProfile(nameServiceProfile?: NameServiceProfile) {
  return nameServiceProfile ? !nameServiceProfile.name.endsWith(".ar") : false;
}

export function useRegistrationFee(name: string, purchaseType: PurchaseType, purchaseYears?: number) {
  return useQuery(
    {
      queryKey: ["registration-fee", name, purchaseType, purchaseYears],
      queryFn: async () => {
        const registrationFees = await getRegistrationFees();

        if (!registrationFees) return null;

        const fee = registrationFees[lowerCaseDomain(name).length.toString()];
        const arioPrice = purchaseType === "lease" ? fee.lease[purchaseYears.toString()] : fee.permabuy;

        return new mARIOToken(arioPrice).toARIO().valueOf();
      },
      enabled: !!name,
      staleTime: calculateStaleTimeFromEpochZeroTimestamp(),
    },
    ARNS_QUERY_CLIENT,
  );
}

export async function getRegistrationFees(): Promise<AoRegistrationFees | null> {
  try {
    const result = await ARNS_QUERY_CLIENT.fetchQuery({
      queryKey: ["arns-registration-fees"],
      queryFn: () => {
        return ARIO_READ_SDK.getRegistrationFees();
      },
      staleTime: calculateStaleTimeFromEpochZeroTimestamp(),
    }).catch((error) => {
      console.error(`Error in retrieving ArNS registration fees:`, error);
      return null;
    });

    return result;
  } catch (error) {
    console.error(`Unexpected error in getRegistrationFees:`, error);
    return null;
  }
}
export type PurchaseArNSNameParams = {
  name: string;
  purchaseType: PurchaseType;
  purchaseYears?: number;
  transactionListener: (state: string) => void;
};

export async function purchaseArNSName({
  name,
  purchaseType,
  purchaseYears,
  transactionListener,
}: PurchaseArNSNameParams) {
  let decryptedWallet: DecryptedWallet;

  try {
    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const signer = new ArweaveSigner(decryptedWallet.keyfile);

    const writeSDK = ARIO.init({
      signer,
      process: new AOProcess({
        processId: ARIO_PROCESS_ID,
        ao: cuAoInstance,
      }),
    });

    transactionListener("Purchasing name...");

    const result = await writeSDK.buyRecord(
      {
        name,
        type: purchaseType,
        years: purchaseYears,
        fundFrom: "balance", // TODO: add support for other funding sources
        referrer: "Wander",
      },
      {
        onSigningProgress: (step, payload) => {
          if (step === "spawning-ant") {
            log(LOG_GROUP.ARNS, "Spawning ant:", payload);
            transactionListener("Spawning ANT...");
          } else if (step === "registering-ant") {
            log(LOG_GROUP.ARNS, "Registering ant:", payload);
            transactionListener("Registering ANT...");
          } else if (step === "verifying-state") {
            log(LOG_GROUP.ARNS, "Verifying state:", payload);
            transactionListener("Verifying ANT state...");
          } else if (step === "buying-name") {
            transactionListener("Purchasing name...");
          } else {
            log(LOG_GROUP.ARNS, "Unknown step:", step);
          }
        },
      },
    );

    return {
      transactionId: result.id,
    };
  } finally {
    if (decryptedWallet?.type === "local") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}

export async function getArNSRecordsForAddress(
  params: PaginationParams<AoArNSNameDataWithName> & {
    antRegistryId?: string;
    address: WalletAddress;
  },
) {
  return ARIO_READ_SDK.getArNSRecordsForAddress(params);
}

export async function setPrimaryName({
  name,
  transactionListener,
}: {
  name: string;
  transactionListener: (state: string) => void;
}) {
  let decryptedWallet: DecryptedWallet;

  try {
    decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const signer = new ArweaveSigner(decryptedWallet.keyfile);

    const writeSDK = ARIO.init({
      signer,
      process: new AOProcess({
        processId: ARIO_PROCESS_ID,
        ao: cuAoInstance,
      }),
    });

    const result = await writeSDK.setPrimaryName(
      {
        name,
        referrer: "Wander",
        fundFrom: "balance",
      },
      {
        onSigningProgress: (step, payload) => {
          if (step === "requesting-primary-name") {
            transactionListener("Requesting primary name...");
          } else if (step === "request-already-exists") {
            transactionListener("Existing primary name request found...");
          } else if (step === "approving-request") {
            transactionListener("Approving primary name request...");
          }
        },
      },
    );

    return {
      success: true,
      transactionId: result.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (decryptedWallet?.type === "local") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
}

// HOOKS

export function useArNSRecordsForAddress({ address }: { address: WalletAddress }) {
  return useQuery(
    {
      queryKey: ["arns-records-for-address", address],
      queryFn: async () => {
        const results = await getArNSRecordsForAddress({ address });
        return results.items.sort((a, b) => a.name.localeCompare(b.name));
      },
      // 1 week; this should be refreshed when user mutates in app or user can use refresh button
      staleTime: 7 * 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !!address,
    },
    ARNS_QUERY_CLIENT,
  );
}

export function usePrimaryNameCostDetails({ name }: { name: string }) {
  const walletAddress = useActiveAddress();

  return useQuery(
    {
      queryKey: ["cost-details", name, walletAddress],
      queryFn: async () => {
        return ARIO_READ_SDK.getCostDetails({
          intent: "Primary-Name-Request",
          name,
          fromAddress: walletAddress,
          fundFrom: "balance",
        });
      },
      staleTime: calculateStaleTimeFromEpochZeroTimestamp(),
      refetchOnWindowFocus: false,
      enabled: !!walletAddress,
    },
    ARNS_QUERY_CLIENT,
  );
}

const ARIO_TOKEN_INFO: TokenInfo = {
  Denomination: 6,
  processId: ARIO_PROCESS_ID,
};

export function useArioBalance() {
  const activeWallet = useActiveWallet();

  const { data: arioBalanceString } = useTokenBalance(ARIO_TOKEN_INFO, activeWallet?.address);

  const arioBalance = useMemo(() => {
    return arioBalanceString ? parseFloat(arioBalanceString) : undefined;
  }, [arioBalanceString]);

  return arioBalance;
}

export function useIsArNSPurchaseGated() {
  const { data: activeTier } = useActiveTier();

  return useMemo(() => {
    const tierId = tierNameToId[activeTier?.tier || TierTypes.Core];
    return tierId > RESERVE_TIER_ID && ARNS_PURCHASE_DISABLED_FOR_LOWER_TIERS;
  }, [activeTier?.tier]);
}

export function useHasArnsNames() {
  const address = useActiveAddress();
  const { data: arnsRecords = [] } = useArNSRecordsForAddress({ address });

  return useMemo(() => arnsRecords?.length > 0, [arnsRecords]);
}
