import {
  ANT,
  ANT_REGISTRY_ID,
  ANTRegistry,
  ANTVersions,
  AOProcess,
  ARIO,
  ARIO_MAINNET_PROCESS_ID,
  ArweaveSigner,
  createAoSigner,
  DEFAULT_SCHEDULER_ID,
  spawnANT,
  type AoANTInfo,
  type AoANTState,
  type AoArNSNameData,
  type AoPrimaryName,
  type SpawnANTState,
} from "@ar.io/sdk/web";
import { connect } from "@permaweb/aoconnect/browser";
import { QueryClient, useQuery } from "@tanstack/react-query";
import type { PurchaseType } from "~routes/popup/arns/types";
import { isLocalWallet } from "~utils/assertions";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { NameServiceProfile } from "./types";

export const LANDING_PAGE_TXID = "oork_YifB3-JQQZg8EgMPQJytua_QCHKNmMqt5kmnCo";
export const DEFAULT_ANT_LOGO = "Sie_26dvgyok0PZD_-iQAFOhOd5YxDTkczOLoqTTL_A";

// Query client for ArNS profile caching
const arnsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
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
export async function getPrimaryArNSName(address: string): Promise<AoPrimaryName | undefined> {
  return ARIO_READ_SDK.getPrimaryName({ address });
}

async function fetchArNSProfile(query: string): Promise<NameServiceProfile | undefined> {
  if (!query) {
    return undefined;
  }

  try {
    // Fetch the primary name and logo
    const primaryName = await getPrimaryArNSName(query);
    const logo = await findLogo(primaryName);

    return {
      address: query,
      name: primaryName?.name,
      logo,
    };
  } catch (error) {
    console.error("Error fetching ArNS profile:", error);
    return undefined;
  }
}

export async function getArNSProfile(query: string): Promise<NameServiceProfile | undefined> {
  if (!query) {
    return undefined;
  }

  try {
    const result = await arnsQueryClient
      .fetchQuery({
        queryKey: ["arns-profile", query],
        queryFn: () => fetchArNSProfile(query),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
      .catch((error) => {
        console.error(`Error in ArNS profile query for ${query}:`, error);
        return undefined;
      });

    return result;
  } catch (error) {
    console.error(`Unexpected error in getArNSProfile for ${query}:`, error);
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
  return useQuery({
    queryKey: ["ario-ticker"],
    queryFn: getTicker,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    placeholderData: "ARIO",
  });
}

export function isArNSNameProfile(nameServiceProfile?: NameServiceProfile) {
  return nameServiceProfile ? !nameServiceProfile.name.endsWith(".ar") : false;
}

export async function getDemandFactor() {
  try {
    const result = await arnsQueryClient
      .fetchQuery({
        queryKey: ["arns-deman-factor"],
        queryFn: () => {
          return ARIO_READ_SDK.getDemandFactor();
        },
        staleTime: 24 * 60 * 60 * 1000, // 1 day, good for length of epoch
      })
      .catch((error) => {
        console.error(`Error in ArNS demand factor query:`, error);
        return undefined;
      });

    return result;
  } catch (error) {
    console.error(`Unexpected error in getDemandFactor:`, error);
    return undefined;
  }
}

const feeTable = [0, 1000000, 200000, 20000, 10000, 2500, 1500, 800, 500, 400, 350, 300, 250, 200];

export type ArNSFeeDetails = {
  arf: number;
  af: number;
  oneYearLeaseFee: number;
  permabuyFee: number;
  undernameFee: number;
  permabuyUndernameFee: number;
};
export async function getPriceDetails(name: string): Promise<ArNSFeeDetails | undefined> {
  if (name.length == 0) {
    return undefined;
  }

  const demandFactor = await getDemandFactor();

  const index = Math.min(feeTable.length - 1, name.length);

  const baseFee = feeTable[index];

  // adjusted registration fee
  const arf = baseFee * demandFactor;
  const af = arf * 0.2;

  return {
    arf,
    af,
    oneYearLeaseFee: arf + af * 1,
    permabuyFee: arf + af * 20,
    undernameFee: baseFee * demandFactor * 0.001,
    permabuyUndernameFee: baseFee * demandFactor * 0.005,
  };
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

async function getLatestANTVersion() {
  return arnsQueryClient.fetchQuery({
    queryKey: ["ant-latest-versions"],
    queryFn: async () => {
      const versionRegistry = ANTVersions.init({
        process: new AOProcess({
          processId: ANT_REGISTRY_ID,
          ao: AO_CLIENT,
        }),
      });
      return versionRegistry.getLatestANTVersion();
    },
    staleTime: Infinity, // these rarely change
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    const state = createDefaultAntState({
      owner: decryptedWallet.address,
      controllers: [decryptedWallet.address],
      balances: { [decryptedWallet.address]: 1 },
      records: {
        ["@"]: {
          transactionId: LANDING_PAGE_TXID.toString(),
          ttlSeconds: 900,
        },
      },
    });

    const latestANTVersion = await getLatestANTVersion();

    // 1. Spawn new ANT
    transactionListener("Spawning new ANT...");
    const antProcessId = await spawnANT({
      state,
      signer: createAoSigner(signer),
      ao: AO_CLIENT,
      scheduler: DEFAULT_SCHEDULER_ID,
      module: latestANTVersion.moduleId,
    });

    // 2. Register ANT with ANT Registry
    transactionListener("Registering ANT with ANT Registry...");
    const antRegistry = ANTRegistry.init({
      process: new AOProcess({
        processId: ANT_REGISTRY_ID,
        ao: AO_CLIENT,
      }),
    });

    let antRegistryUpdated = false;
    let retries = 0;
    const maxRetries = 10;
    // We need to wait for the registration to get cranked
    while (!antRegistryUpdated && retries <= maxRetries) {
      await sleep(2000 * retries);
      const aclRes = await antRegistry.accessControlList({
        address: decryptedWallet.address,
      });

      const antIdSet = new Set([...aclRes.Controlled, ...aclRes.Owned]);
      antRegistryUpdated = antIdSet.has(antProcessId);
      retries++;
    }
    if (!antRegistryUpdated) {
      throw new Error("Failed to register ANT, please try again later.");
    }

    const writeSDK = ARIO.init({
      signer,
      process: new AOProcess({
        processId: ARIO_PROCESS_ID,
        ao: AO_CLIENT,
      }),
    });

    transactionListener("Purchasing name...");

    const result = await writeSDK.buyRecord({
      name,
      type: purchaseType,
      years: purchaseYears,
      processId: antProcessId,
      fundFrom: "balance", // TODO: add support for other funding sources
    });

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
