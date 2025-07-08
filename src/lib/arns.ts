import { QueryClient } from "@tanstack/react-query";
import type { NameServiceProfile } from "./types";
import {
  ARIO,
  ARIO_MAINNET_PROCESS_ID,
  AOProcess,
  ANT,
  type AoANTInfo,
  type AoArNSNameData,
  type AoANTState,
  type AoPrimaryName,
} from "@ar.io/sdk/web";
import { connect } from "@permaweb/aoconnect/browser";

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

export const ARIO_READ_SDK = ARIO.init({
  process: new AOProcess({
    processId: ARIO_MAINNET_PROCESS_ID,
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

export function isArNSNameProfile(nameServiceProfile?: NameServiceProfile) {
  return nameServiceProfile ? !nameServiceProfile.name.endsWith(".ar") : false;
}
