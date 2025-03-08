import { pLimit } from "plimit-lit";
import { AOProcess } from "./ao";
import type { NameServiceProfile } from "./types";

export const AO_ARNS_PROCESS = "qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE";

export type ProcessId = string;
export type WalletAddress = string;
export type RegistrationType = "lease" | "permabuy";

export type AoArNSBaseNameData = {
  processId: ProcessId;
  startTimestamp: number;
  type: RegistrationType;
  undernameLimit: number;
  purchasePrice: number;
};

export type ANTRecord = {
  transactionId: string;
  ttlSeconds: number;
};

export type AoANTState = {
  Name: string;
  Ticker: string;
  Denomination: number;
  Owner: WalletAddress;
  Controllers: WalletAddress[];
  Records: Record<string, ANTRecord>;
  Balances: Record<WalletAddress, number>;
  Logo: string;
  TotalSupply: number;
  Initialized: boolean;
};

export type AoArNSLeaseData = AoArNSBaseNameData & {
  type: "lease";
  endTimestamp: number; // At what unix time (seconds since epoch) the lease ends
};

export type AoArNSPermabuyData = AoArNSBaseNameData & {
  type: "permabuy";
};
export type AoArNSNameData = AoArNSPermabuyData | AoArNSLeaseData;
export type ANTInfo = {
  Name: string;
  Ticker: string;
  Denomination: number;
  Owner: string;
};
export type ArNSPrimaryName = {
  owner: WalletAddress;
  name: string;
  startTimestamp: number;
  processId: string;
};

export async function getArNSRecord(
  name: string
): Promise<AoArNSNameData | undefined> {
  const ArIO = new AOProcess({ processId: AO_ARNS_PROCESS });
  const record = await ArIO.read<AoArNSNameData>({
    tags: [
      { name: "Action", value: "Record" },
      { name: "Name", value: name }
    ]
  });
  return record;
}

export async function getArNSRecords(): Promise<
  Record<string, AoArNSNameData>
> {
  const ArIO = new AOProcess({ processId: AO_ARNS_PROCESS });
  const record = await ArIO.read<Record<string, AoArNSNameData>>({
    tags: [{ name: "Action", value: "Records" }]
  });
  return record;
}

export async function getANTInfo(processId: string): Promise<ANTInfo> {
  const ant = new AOProcess({ processId });
  const tags = [{ name: "Action", value: "Info" }];
  const info = await ant.read<ANTInfo>({ tags });
  return info;
}

export async function getANTState(
  processId: string,
  retries = 3
): Promise<AoANTState> {
  const ant = new AOProcess({ processId });
  const tags = [{ name: "Action", value: "State" }];
  const res = await ant.read<AoANTState>({ tags, retries });
  return res;
}

export const getAllArNSNames = async (
  address: WalletAddress
): Promise<string[]> => {
  if (!address) return [];

  const throttle = pLimit(50);

  const arnsRecords = await getArNSRecords().then((records) =>
    Object.values(records).filter((record) => record.processId !== undefined)
  );

  // check the contract owner and controllers
  const results = await Promise.all(
    arnsRecords.map(async (record) =>
      throttle(async () => {
        try {
          const state = await getANTState(record.processId, 1);

          if (state.Owner === address || state.Controllers.includes(address)) {
            return state.Name;
          }
          return;
        } catch (err) {
          return;
        }
      })
    )
  );

  if (results.length === 0) {
    return [];
  }

  return Array.from(new Set(results.filter((result) => result)));
};

export async function searchArNSName(name: string) {
  name = name.toLowerCase();
  const record = await getArNSRecord(name);

  if (record?.processId) {
    const info = await getANTInfo(record?.processId);

    return {
      success: true,
      record: { ...record, owner: info.Owner }
    };
  }
  return {
    success: false,
    record: null
  };
}

/**
 * Generalized method to find the logo (avatar) for an ArNS name.
 * Fetches the ArNS record and ANT info to retrieve the transaction ID for the logo.
 * @param name - The ArNS name to fetch the logo for.
 * @returns The transaction ID of the logo if found, otherwise undefined.
 */
export async function findLogo(processId: string): Promise<string | undefined> {
  try {
    // Fetch the ANT info to get the logo transaction ID
    const antInfo = await getANTState(processId);
    return antInfo?.Logo;
  } catch (error) {
    console.error(`Failed to fetch logo for name ${name}:`, error);
    return undefined;
  }
}

/**
 * Fetches the primary ArNS name for a wallet address.
 * @param address - Wallet address to fetch the primary name for.
 * @returns Primary name record or undefined.
 */
export async function getPrimaryArNSName(
  address: WalletAddress
): Promise<ArNSPrimaryName | undefined> {
  const ArIO = new AOProcess({ processId: AO_ARNS_PROCESS });
  // Use retries of 1 as AOProcess is treating assertion errors (i.e., "Primary name not found") as
  // a retry-able error.
  const primaryName = ArIO.read<ArNSPrimaryName>({
    tags: [
      { name: "Action", value: "Primary-Name" },
      { name: "Address", value: address }
    ],
    retries: 1
  });
  return primaryName;
}

export async function getArNSProfile(
  query: string
): Promise<NameServiceProfile | undefined> {
  if (!query) {
    return undefined;
  }

  try {
    // Fetch the primary name and logo
    const primaryName = await getPrimaryArNSName(query);
    const logo = await findLogo(primaryName.processId);

    return {
      address: query,
      name: primaryName?.name,
      logo
    };
  } catch (error) {
    console.error("Error fetching ArNS profile:", error);
  }

  return undefined;
}
