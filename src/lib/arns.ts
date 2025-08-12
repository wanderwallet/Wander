import {
  ANT,
  AOProcess,
  ARIO,
  ARIO_MAINNET_PROCESS_ID,
  ArweaveSigner,
  type AoANTInfo,
  type AoANTState,
  type AoArNSNameData,
  type AoArNSNameDataWithName,
  type AoPrimaryName,
  type AoRegistrationFees,
  type PaginationParams,
  type SpawnANTState,
  type WalletAddress,
} from "@ar.io/sdk/web";
import { connect } from "@permaweb/aoconnect/browser";
import { QueryClient, useQuery } from "@tanstack/react-query";
import type { PurchaseType } from "~routes/popup/arns/types";
import { isLocalWallet } from "~utils/assertions";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { NameServiceProfile } from "./types";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createExtensionStoragePersister } from "~utils/query/createExtensionStoragePersister";
import { useActiveAddress, useActiveWallet } from "~wallets/hooks";
import { PersistentStorage, useStorage } from "~utils/storage";
import { fetchTokenBalance, type TokenInfoWithBalance } from "~tokens/aoTokens/ao";
import { useEffect, useState } from "react";

export const LANDING_PAGE_TXID = "oork_YifB3-JQQZg8EgMPQJytua_QCHKNmMqt5kmnCo";
export const DEFAULT_ANT_LOGO = "Sie_26dvgyok0PZD_-iQAFOhOd5YxDTkczOLoqTTL_A";

// Query client for ArNS profile caching
export const ARNS_QUERY_CLIENT = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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

const aoCuUrl = "https://cu.ardrive.io";

export const AO_CLIENT = connect({
  CU_URL: aoCuUrl,
});

export const ARIO_PROCESS_ID = process.env.PLASMO_PUBLIC_ARIO_PROCESS_ID ?? ARIO_MAINNET_PROCESS_ID;

export const ARIO_READ_SDK = ARIO.init({
  process: new AOProcess({
    processId: ARIO_PROCESS_ID,
    ao: AO_CLIENT,
  }),
});

export async function getArNSRecord(name: string): Promise<AoArNSNameData | undefined> {
  const record = await ARIO_READ_SDK.getArNSRecord({ name });
  return record;
}

export async function getANTInfo(processId: string): Promise<AoANTInfo> {
  const ant = ANT.init({
    process: new AOProcess({ processId, ao: AO_CLIENT }),
  });

  return ant.getInfo();
}

export async function getANTState(processId: string): Promise<AoANTState> {
  const ant = ANT.init({
    process: new AOProcess({ processId, ao: AO_CLIENT }),
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
      name: primaryName?.name,
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
      staleTime: 5 * 60 * 1000, // 5 minutes
    }).catch((error) => {
      console.error(`Error in ArNS profile query for ${walletAddress}:`, error);
      return undefined;
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
      queryKey: ["ario-ticker"],
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

export async function getRegistrationFees(): Promise<AoRegistrationFees | null> {
  try {
    const result = await ARNS_QUERY_CLIENT.fetchQuery({
      queryKey: ["arns-registration-fees"],
      queryFn: () => {
        return ARIO_READ_SDK.getRegistrationFees();
      },
      staleTime: 24 * 60 * 60 * 1000, // 1 day, good for length of epoch
    }).catch((error) => {
      console.error(`Error in ArNS demand factor query:`, error);
      return null;
    });

    return result;
  } catch (error) {
    console.error(`Unexpected error in getDemandFactor:`, error);
    return undefined;
  }
}
export function createDefaultAntState(state: Partial<SpawnANTState>): SpawnANTState {
  return {
    ticker: "aos",
    name: "ANT",
    controllers: [],
    balances: {},
    owner: "",
    description: "",
    keywords: [],
    records: {
      ["@"]: {
        transactionId: LANDING_PAGE_TXID.toString(),
        ttlSeconds: 900,
      },
    },
    logo: DEFAULT_ANT_LOGO,
    ...state,
  };
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
        ao: AO_CLIENT,
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
            console.log("Spawning ant:", payload);
            transactionListener("Spawning ANT...");
          } else if (step === "registering-ant") {
            console.log("Registering ant:", payload);
            transactionListener("Registering ANT...");
          } else if (step === "verifying-state") {
            console.log("Verifying state:", payload);
            transactionListener("Verifying ANT state...");
          } else if (step === "buying-name") {
            transactionListener("Purchasing name...");
          } else {
            console.log("Unknown step:", step);
          }
        },
      },
    );

    return {
      success: true,
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
        ao: AO_CLIENT,
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
      queryFn: async () => getArNSRecordsForAddress({ address }),
      staleTime: 5 * 60 * 1000,
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
      queryKey: ["cost-details"],
      queryFn: async () => {
        return ARIO_READ_SDK.getCostDetails({
          intent: "Primary-Name-Request",
          name,
          fromAddress: walletAddress?.toString(),
          fundFrom: "balance",
        });
      },
      staleTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !!walletAddress,
    },
    ARNS_QUERY_CLIENT,
  );
}

export function useArioBalance() {
  const [balance, setBalance] = useState<number | undefined>();
  const activeWallet = useActiveWallet();

  const [aoTokens] = useStorage<TokenInfoWithBalance[]>(
    {
      key: "ao_tokens",
      instance: PersistentStorage,
    },
    [],
  );

  useEffect(() => {
    const tokenInfo = aoTokens.find((token) => token.processId === ARIO_PROCESS_ID);

    if (!tokenInfo) setBalance(undefined);

    fetchTokenBalance(tokenInfo, activeWallet?.address).then((balance) => {
      setBalance(parseFloat(balance));
    });
  }, [aoTokens]);

  return balance;
}
