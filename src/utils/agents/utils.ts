import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { ExtensionStorage } from "~utils/storage";
import type { AOYieldAgent, AOYieldAgentInfo, AOYieldAgentStatus, MintingStatus, Tag } from "./types";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { createDataItemSigner, getTagValue, Id, Owner, WAR_PROCESS_ID, WUSDC_PROCESS_ID } from "~tokens/aoTokens/ao";
import { getActiveAddress, getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { retryWithDelay } from "~utils/promises/retry";
import { TRANSACTION_QUERY } from "./queries";
import type GQLResultInterface from "ar-gql/dist/faces";
import { formatBalance } from "~utils/format";
import { balanceToFractioned } from "~tokens/currency";
import { freeDecryptedWallet } from "~wallets/encryption";
import WarIcon from "url:/assets/ecosystem/war.svg";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import type { Asset } from "~utils/agents/types";

/**
 * Initializes a default Arweave instance.
 */
export const arweave = Arweave.init(defaultGateway);

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
 * Checks if a string is a valid URL.
 *
 * @param url - The string to be checked.
 * @returns True if the string is a valid URL, false otherwise.
 */
export function isUrl(url?: string): boolean {
  try {
    if (!url || typeof url !== "string") {
      return false;
    }
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
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
  const urlValid = isUrl(value);
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
  await ExtensionStorage.set(`ao_yield_agents_${activeAddress}`, agents);
}

export async function getAOYieldActiveAgent() {
  const activeAddress = await getActiveAddress();
  const agents = await getAOYieldAgents(activeAddress, "Active");
  return agents[agents.length - 1];
}

export async function getAOYieldAgentInfo(agentId: string) {
  const aoInstance = connect(defaultConfig);

  const dryrunRes = await aoInstance.dryrun({
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
  } as AOYieldAgentInfo;
}

/**
 * Builds tags array for agent update based on the update data
 */
function buildUpdateTags(updateData: Partial<AOYieldAgent>): Tag[] {
  const tags: Tag[] = [{ name: "Action", value: "Update-Agent" }];

  const tagMappings: Array<{
    key: keyof Partial<AOYieldAgent>;
    tagName: string;
    transform?: (value: any) => string;
  }> = [
    { key: "slippage", tagName: "Slippage", transform: (v) => v.toString() },
    { key: "tokenOut", tagName: "Token-Out" },
    { key: "startDate", tagName: "Start-Date", transform: (v) => v.toString() },
    { key: "endDate", tagName: "End-Date", transform: (v) => v.toString() },
    { key: "runIndefinitely", tagName: "Run-Indefinitely", transform: (v) => v.toString() },
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
function updateAgentProperties(agent: AOYieldAgent, updateData: Partial<AOYieldAgent>): void {
  const updatableFields: Array<keyof AOYieldAgent> = [
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
}

export async function updateAOYieldAgent(agentId: string, updateData: Partial<AOYieldAgent>) {
  try {
    const aoInstance = connect(defaultConfig);

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

    const result = await aoInstance.result({
      process: agentId,
      message: messageId,
    });

    if (result.Error) {
      throw new Error(`Failed to update agent: ${result.Error}`);
    }

    // Update local storage
    const activeAddress = await getActiveAddress();
    const agents = await getAOYieldAgents(activeAddress);
    const agent = agents.find((agent) => agent.id === agentId);

    if (agent) {
      updateAgentProperties(agent, updateData);
      await setAOYieldAgents(activeAddress, agents);
    } else {
      console.warn(`Agent with ID ${agentId} not found in local storage`);
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
  },
  {
    ticker: "wAR",
    logo: WarIcon,
    id: WAR_PROCESS_ID,
  },
];

export const tokenIdInfoMap = {
  [WUSDC_PROCESS_ID]: assets[0],
  [WAR_PROCESS_ID]: assets[1],
};

export function formatTokenQuantity(value: string, decimals: number) {
  return formatBalance(balanceToFractioned(String(value), { decimals })).displayBalance;
}
