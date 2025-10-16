import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { ExtensionStorage } from "~utils/storage";
import type { AOYieldAgent, AOYieldAgentInfo, AOYieldAgentStatus, MintingStatus, RecentTx, Tag } from "../types";
import { createDataItemSigner, getTagValue } from "~tokens/aoTokens/ao";
import { getActiveAddress, getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { retryWithDelay } from "~utils/promises/retry";
import { TRANSACTION_QUERY } from "../queries";
import type GQLResultInterface from "ar-gql/dist/faces";
import { formatBalance } from "~utils/format";
import { balanceToFractioned } from "~tokens/currency";
import { freeDecryptedWallet } from "~wallets/encryption";
import WarIcon from "url:/assets/ecosystem/war.png";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import type { Asset } from "~utils/agents/types";
import { AO_YIELD_AGENT_RECENT_TXS, WANDER_FEE_PROCESS_ID } from "../constants";
import dayjs from "dayjs";
import { isURL } from "~utils/urls/isURL";
import { queryClient } from "~utils/tanstack";
import { Mutex } from "~utils/mutex";
import { Id, Owner, WAR_PROCESS_ID, WUSDC_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { FWD_HB_NODE, WNDR_HB_NODE } from "~constants/api";
import { aoInstance, wndrAoInstance } from "~utils/aoconnect";

const agentStorageMutex = new Mutex();

/**
 * Initializes a default Arweave instance.
 */
export const arweave = Arweave.init(defaultGateway);

/**
 * Checks if version a is greater than or equal to version b
 * @param a - The first version to compare
 * @param b - The second version to compare
 * @returns True if version a is greater than or equal to version b, false otherwise
 */
export function isVersionGte(a: string, b: string): boolean {
  try {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    const len = Math.max(pa.length, pb.length);

    for (let i = 0; i < len; i++) {
      const na = pa[i] ?? 0;
      const nb = pb[i] ?? 0;

      if (na > nb) return true;
      if (na < nb) return false;
    }

    return true; // Equal versions
  } catch (error) {
    console.error("Error comparing versions: ", a, b, error);
    return false;
  }
}

/**
 * Parses a gateway URL and returns an object containing the host, port, and protocol.
 *
 * @param url - The gateway URL to be parsed.
 * @returns An object with the host, port, and protocol of the URL.
 */
function parseGatewayUrl(url: string): {
  host: string;
  port: number;
  protocol: string;
} {
  const parsedUrl = new URL(url);
  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : 443,
    protocol: parsedUrl.protocol.replace(":", ""),
  };
}

/**
 * Initializes an Arweave instance with a custom gateway.
 *
 * @param gateway - The gateway URL to connect to.
 * @returns An Arweave instance configured with the provided gateway.
 */
export function getArweave(gateway?: string) {
  try {
    if (!gateway) return arweave;
    const { host, port, protocol } = parseGatewayUrl(gateway);
    return Arweave.init({ host, port, protocol });
  } catch {
    return arweave;
  }
}

export function isArweaveAddress(address: any): boolean {
  return typeof address === "string" && /^[\w-]{43}$/.test(address);
}

/**
 * Parses a string to an integer.
 * If parsing fails (i.e., the value is NaN), it returns the specified default value.
 *
 * @param value - The string to be parsed.
 * @param defaultValue - The default value to return if parsing fails.
 * @returns The parsed integer or the default value if parsing fails.
 */
export function parseToInt(value: string | number | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsedValue = Number.parseInt(value.toString());
  if (Number.isNaN(parsedValue)) {
    return defaultValue;
  }
  return parsedValue;
}

/**
 * Validates a URL string.
 * If the URL is not valid, it returns the specified default value.
 *
 * @param value - The URL string to be validated.
 * @param defaultValue - The default value to return if the URL is not valid.
 * @returns The URL if valid, or the default value if the URL is not valid.
 */
export function parseUrl(value: string | undefined, defaultValue: string): string {
  if (value === undefined) {
    return defaultValue;
  }
  const urlValid = isURL(value);
  if (!urlValid) {
    return defaultValue;
  }
  return value;
}

export function jsonStringify(value?: any): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return value;
  }
}

export function isCronPattern(cron: string): boolean {
  if (!cron) {
    return false;
  }
  const cronRegex = /^\d+-(?:Second|second|Minute|minute|Hour|hour|Day|day|Month|month|Year|year|Block|block)s?$/;
  return cronRegex.test(cron);
}

interface PollingOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

export async function pollForProcessSpawn({
  processId,
  gatewayUrl,
  options = {},
}: {
  processId: string;
  gatewayUrl?: string;
  options?: PollingOptions;
}): Promise<void> {
  const { maxAttempts = 10, initialDelayMs = 3000, backoffFactor = 1.5 } = options;

  const arweave = getArweave(gatewayUrl);

  const queryTransaction = async () => {
    const response = await arweave.api.post("/graphql", {
      query: TRANSACTION_QUERY,
      variables: { ids: [processId] },
    });

    const transaction = response?.data?.data?.transactions?.edges?.[0]?.node;
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return transaction;
  };

  try {
    await retryWithDelay(
      queryTransaction,
      maxAttempts,
      initialDelayMs,
      (attempt) => initialDelayMs * Math.pow(backoffFactor, attempt - 1),
    );
  } catch {
    throw new Error(
      `Failed to find process ${processId} after ${maxAttempts} attempts. The process may still be spawning.`,
    );
  }
}

export async function getAOYieldAgents(activeAddress: string, status?: AOYieldAgentStatus) {
  const agents = ((await ExtensionStorage.get(`ao_yield_agents_${activeAddress}`)) || []) as AOYieldAgent[];
  if (status) {
    return agents.filter((agent) => agent.status === status);
  }

  return agents;
}

export async function setAOYieldAgents(activeAddress: string, agents: AOYieldAgent[]) {
  const unlock = await agentStorageMutex.lock();
  try {
    await ExtensionStorage.set(`ao_yield_agents_${activeAddress}`, agents);
  } finally {
    unlock();
  }
}

/**
 * Updates a local AO Yield Agent with the provided data
 * @param agentId - The ID of the agent to update
 * @param updateData - Partial agent data to update
 * @param activeAddress - Optional active address, will fetch if not provided
 * @returns Promise<boolean> - Returns true if agent was found and updated, false otherwise
 */
export async function updateLocalAOYieldAgent(
  agentId: string,
  updateData: Partial<AOYieldAgent>,
  activeAddress?: string,
): Promise<boolean> {
  try {
    const address = activeAddress || (await getActiveAddress());
    const agents = await getAOYieldAgents(address);
    const foundAgentIndex = agents.findIndex((agent) => agent.id === agentId);

    if (foundAgentIndex !== -1) {
      agents[foundAgentIndex] = updateAgentProperties(agents[foundAgentIndex], updateData);
      await setAOYieldAgents(address, agents);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error updating local AO Yield Agent", error);
    return false;
  }
}

export async function getRecentTxs(): Promise<RecentTx[]> {
  const recentTxs = await ExtensionStorage.get<RecentTx[]>(AO_YIELD_AGENT_RECENT_TXS);
  return recentTxs || [];
}

export async function setRecentTxs(recentTxs: RecentTx[]) {
  await ExtensionStorage.set(AO_YIELD_AGENT_RECENT_TXS, recentTxs);
}

export async function getAOYieldActiveAgent() {
  const activeAddress = await getActiveAddress();
  const agents = await getAOYieldAgents(activeAddress, "Active");
  return agents[agents.length - 1];
}

export async function getAOYieldAgentInfo(agentId: string, currentAgentVersion: string = "1.0.0", attempt: number = 0) {
  try {
    if (currentAgentVersion && isVersionGte(currentAgentVersion, "1.0.2")) {
      throw new Error("Fetch agent info from the HB node");
    }

    const aoInstanceToUse = attempt % 2 === 0 ? wndrAoInstance : aoInstance;
    const dryrunRes = await aoInstanceToUse.dryrun({
      Id,
      Owner,
      process: agentId,
      tags: [{ name: "Action", value: "Info" }],
    });

    const message = dryrunRes.Messages?.[0];
    const tags = message?.Tags;

    const dex = getTagValue("Dex", tags);
    const status = getTagValue("Status", tags);
    const tokenOut = getTagValue("Token-Out", tags);
    const conversionPercentage = getTagValue("Conversion-Percentage", tags);
    const startDate = getTagValue("Start-Date", tags);
    const endDate = getTagValue("End-Date", tags);
    const runIndefinitely = getTagValue("Run-Indefinitely", tags);
    const slippage = getTagValue("Slippage", tags);
    const totalAOSold = getTagValue("Total-AO-Sold", tags);
    const totalBought = getTagValue("Total-Bought", tags);
    const totalTransactions = getTagValue("Total-Transactions", tags);
    const totalWanderFee = getTagValue("Total-Wander-Fee", tags);
    const swapInProgress = getTagValue("Swap-In-Progress", tags);
    const processedUpToDate = getTagValue("Processed-Up-To-Date", tags);
    const swappedUpToDate = getTagValue("Swapped-Up-To-Date", tags);
    const agentVersion = getTagValue("Agent-Version", tags);

    return {
      id: agentId,
      status,
      dex,
      tokenOut,
      conversionPercentage: Number(conversionPercentage),
      startDate: Number(startDate),
      endDate: Number(endDate),
      runIndefinitely: runIndefinitely === "true",
      slippage: Number(slippage),
      totalAOSold,
      totalBought: JSON.parse(totalBought),
      totalTransactions: Number(totalTransactions),
      totalWanderFee,
      swapInProgress: swapInProgress === "true",
      processedUpToDate: processedUpToDate && processedUpToDate !== "nil" ? Number(processedUpToDate) : undefined,
      swappedUpToDate: swappedUpToDate && swappedUpToDate !== "nil" ? Number(swappedUpToDate) : undefined,
      agentVersion,
    } as AOYieldAgentInfo;
  } catch (error) {
    if (!isVersionGte(currentAgentVersion, "1.0.2")) {
      throw new Error("Agent version is required & must be greater than 1.0.2");
    }

    log(LOG_GROUP.AGENTS, `Fetching agent info from the HB node with agent version: ${currentAgentVersion}`);
    const hbNode = attempt % 2 === 0 ? WNDR_HB_NODE : FWD_HB_NODE;
    const response = await fetch(`${hbNode}/${agentId}/~process@1.0/now/agent-info/~json@1.0/serialize?bundle`);
    if (!response.ok) {
      throw new Error("Failed to fetch agent info");
    }
    const data = await response.json();

    const dex = data.dex;
    const status = data.status;
    const tokenOut = data["token-out"] ?? data.tokenOut;
    const conversionPercentage = data["conversion-percentage"] ?? data.conversionPercentage;
    const startDate = data["start-date"] ?? data.startDate;
    const endDate = data["end-date"] ?? data.endDate;
    const runIndefinitely = data["run-indefinitely"] ?? data.runIndefinitely;
    const slippage = data.slippage;
    const totalAOSold = data["total-ao-sold"] ?? data.totalAOSold;
    const totalBought = data["total-bought"] ?? data.totalBought;
    const totalTransactions = data["total-transactions"] ?? data.totalTransactions;
    const totalWanderFee = data["total-wander-fee"] ?? data.totalWanderFee;
    const swapInProgress = data["swap-in-progress"] ?? data.swapInProgress;
    const processedUpToDate = data["processed-up-to-date"] ?? data.processedUpToDate;
    const swappedUpToDate = data["swapped-up-to-date"] ?? data.swappedUpToDate;
    const agentVersion = data["agent-version"] ?? data.agentVersion;

    let totalBoughtObj = {};
    if (typeof totalBought === "object" && totalBought !== null) {
      totalBoughtObj = totalBought;
    } else {
      try {
        totalBoughtObj = JSON.parse(totalBought);
      } catch {}
    }

    return {
      id: agentId,
      status,
      dex,
      tokenOut,
      conversionPercentage: Number(conversionPercentage),
      startDate: Number(startDate),
      endDate: Number(endDate),
      runIndefinitely: runIndefinitely === "true",
      slippage: Number(slippage),
      totalAOSold,
      totalBought: totalBoughtObj,
      totalTransactions: Number(totalTransactions),
      totalWanderFee,
      swapInProgress: swapInProgress === "true",
      processedUpToDate: processedUpToDate && processedUpToDate !== "nil" ? Number(processedUpToDate) : undefined,
      swappedUpToDate: swappedUpToDate && swappedUpToDate !== "nil" ? Number(swappedUpToDate) : undefined,
      agentVersion,
    } as AOYieldAgentInfo;
  }
}

/**
 * Builds tags array for agent update based on the update data
 */
function buildUpdateTags(updateData: Partial<AOYieldAgent> & { fullPatch?: boolean }): Tag[] {
  const tags: Tag[] = [{ name: "Action", value: "Update-Agent" }];

  const tagMappings: Array<{
    key: keyof Partial<AOYieldAgent> | "fullPatch";
    tagName: string;
    transform?: (value: any) => string;
  }> = [
    { key: "slippage", tagName: "Slippage", transform: (v) => v.toString() },
    { key: "tokenOut", tagName: "Token-Out" },
    { key: "startDate", tagName: "Start-Date", transform: (v) => v.toString() },
    { key: "endDate", tagName: "End-Date", transform: (v) => v.toString() },
    { key: "runIndefinitely", tagName: "Run-Indefinitely", transform: (v) => v.toString() },
    { key: "version", tagName: "Agent-Version" },
    { key: "fullPatch", tagName: "Full-Patch", transform: (v) => v.toString() },
    { key: "status", tagName: "Status" },
  ];

  for (const mapping of tagMappings) {
    const value = updateData[mapping.key];
    if (value !== undefined) {
      const tagValue = mapping.transform ? mapping.transform(value) : String(value);
      tags.push({ name: mapping.tagName, value: tagValue });
    }
  }

  return tags;
}

/**
 * Updates local agent data with the provided update data
 */
function updateAgentProperties(agent: AOYieldAgent, updateData: Partial<AOYieldAgent>): AOYieldAgent {
  const updatableFields: Array<keyof AOYieldAgent> = [
    "totalTransactions",
    "conversionPercentage",
    "version",
    "slippage",
    "tokenOut",
    "startDate",
    "endDate",
    "runIndefinitely",
    "status",
  ];

  for (const field of updatableFields) {
    if (updateData[field] !== undefined) {
      (agent as any)[field] = updateData[field];
    }
  }

  return agent;
}

export async function updateAOYieldAgent(
  agentId: string,
  updateData: Partial<AOYieldAgent> & { fullPatch?: boolean },
  skipLocalUpdate: boolean = false,
) {
  try {
    const decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const signer = createDataItemSigner(keyfile);
    const tags = buildUpdateTags(updateData);

    const messageId = await aoInstance.message({
      process: agentId,
      tags,
      signer,
    });

    // Free the keyfile from memory
    freeDecryptedWallet(decryptedWallet.keyfile);

    const result = await retryWithDelay(
      (attempt) => {
        const aoInstanceToUse = attempt % 2 === 0 ? wndrAoInstance : aoInstance;
        return aoInstanceToUse.result({
          process: agentId,
          message: messageId,
        });
      },
      2,
      1000,
    ).catch(() => ({ Error: undefined }));

    if (result.Error) {
      throw new Error(`Failed to update agent: ${result.Error}`);
    }

    if (!skipLocalUpdate) {
      await updateLocalAOYieldAgent(agentId, updateData);
      await queryClient.invalidateQueries({ queryKey: ["ao-yield-agent-info", agentId] });
    }
  } catch (error) {
    throw new Error(`Failed to update AO Yield Agent: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function processTransactions(rawData: GQLResultInterface) {
  const edges = rawData?.data?.transactions?.edges || [];
  const processedTransactions = edges.map((edge) => {
    const tags = edge.node.tags as Tag[];
    return {
      amountIn: getTagValue("Amount-In", tags),
      amountOut: getTagValue("Amount-Out", tags),
      tokenIn: getTagValue("Token-In", tags),
      tokenOut: getTagValue("Token-Out", tags),
      wanderFee: getTagValue("Swap-Fee", tags),
      timestamp: edge.node.block?.timestamp ? edge.node.block.timestamp * 1000 : Date.now(),
      id: edge.node.id,
      cursor: edge.cursor,
    };
  });
  return processedTransactions.filter((tx) => tx.amountIn && tx.amountOut && tx.tokenIn && tx.tokenOut);
}

export function getStatusColor(status: AOYieldAgentStatus, mintingStatus?: MintingStatus) {
  const statusText = getStatusText(status, mintingStatus);

  switch (statusText) {
    case "Active":
      return "#56C980";
    case "Cancelled":
      return "#EE5A4F";
    case "Paused":
      return "#FFE342";
    default:
      return "#6B57F9";
  }
}

export function getStatusText(status: AOYieldAgentStatus, mintingStatus?: MintingStatus) {
  if (mintingStatus && mintingStatus === "Paused" && status === "Active") {
    return "Paused";
  }
  return status;
}

export const assets: Asset[] = [
  {
    ticker: "wUSDC",
    logo: wUSDCIcon,
    id: WUSDC_PROCESS_ID,
    denomination: 6,
  },
  {
    ticker: "wAR",
    logo: WarIcon,
    id: WAR_PROCESS_ID,
    denomination: 12,
  },
];

export const tokenIdInfoMap = {
  [WUSDC_PROCESS_ID]: assets[0],
  [WAR_PROCESS_ID]: assets[1],
};

export function formatTokenQuantity(value: string, decimals: number) {
  return formatBalance(balanceToFractioned(String(value), { decimals })).displayBalance;
}

export function formatDate(date: Date | null, fallbackLabel: string) {
  return date ? dayjs(date).format("MMM D, YYYY") : fallbackLabel;
}

export async function getWanderFee() {
  const defaultFee = "0.25";
  try {
    const dryrunRes = await aoInstance.dryrun({
      Id,
      Owner,
      process: WANDER_FEE_PROCESS_ID,
      tags: [{ name: "Action", value: "Info" }],
    });

    const tags = dryrunRes.Messages?.[0]?.Tags || [];
    const fee = getTagValue("Conversion-Fee", tags) || defaultFee;

    return fee;
  } catch (error) {
    console.error("Error getting wander fee", error);
    return defaultFee;
  }
}
