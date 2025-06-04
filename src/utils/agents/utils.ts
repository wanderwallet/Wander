import Arweave from "arweave";
import { TRANSACTION_QUERY } from "./constants";
import { defaultGateway } from "~gateways/gateway";
import { ExtensionStorage } from "~utils/storage";
import type { AOYieldAgent, AOYieldAgentInfo, AOYieldAgentStatus, Tag } from "./types";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { createDataItemSigner, getTagValue, Id, Owner } from "~tokens/aoTokens/ao";
import { getActiveAddress, getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { retryWithDelay } from "~utils/promises/retry";

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
  const agents = ((await ExtensionStorage.get(`ao-yield-agents-${activeAddress}`)) || []) as AOYieldAgent[];
  if (status) {
    return agents.filter((agent) => agent.status === status);
  }

  return agents;
}

export async function setAOYieldAgents(activeAddress: string, agents: AOYieldAgent[]) {
  await ExtensionStorage.set(`ao-yield-agents-${activeAddress}`, agents);
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

export async function updateAOYieldAgent(agentId: string, updateData: Partial<AOYieldAgent>) {
  const aoInstance = connect(defaultConfig);

  const decryptedWallet = await getActiveKeyfile();
  isLocalWallet(decryptedWallet);
  const keyfile = decryptedWallet.keyfile;

  const signer = createDataItemSigner(keyfile);

  const tags = [{ name: "Action", value: "Update-Agent" }];

  if (updateData.slippage) {
    tags.push({ name: "Slippage", value: updateData.slippage.toString() });
  }

  if (updateData.tokenOut) {
    tags.push({ name: "Token-Out", value: updateData.tokenOut });
  }

  if (updateData.startDate) {
    tags.push({ name: "Start-Date", value: updateData.startDate.toString() });
  }

  if (updateData.endDate) {
    tags.push({ name: "End-Date", value: updateData.endDate.toString() });
  }

  if (updateData.runIndefinitely) {
    tags.push({ name: "Run-Indefinitely", value: updateData.runIndefinitely.toString() });
  }

  if (updateData.status) {
    tags.push({ name: "Status", value: updateData.status });
  }

  const messageId = await aoInstance.message({
    process: agentId,
    tags,
    signer,
  });

  const result = await aoInstance.result({
    process: agentId,
    message: messageId,
  });

  if (result.Error) {
    throw new Error(result.Error);
  }

  const activeAddress = await getActiveAddress();
  const agents = await getAOYieldAgents(activeAddress);
  const agent = agents.find((agent) => agent.id === agentId);
  if (agent) {
    if (updateData.slippage) {
      agent.slippage = updateData.slippage;
    }
    if (updateData.tokenOut) {
      agent.tokenOut = updateData.tokenOut;
    }
    if (updateData.startDate) {
      agent.startDate = updateData.startDate;
    }
    if (updateData.endDate) {
      agent.endDate = updateData.endDate;
    }
    if (updateData.runIndefinitely) {
      agent.runIndefinitely = updateData.runIndefinitely;
    }
    if (updateData.status) {
      agent.status = updateData.status;
    }
    await setAOYieldAgents(activeAddress, agents);
  }
}
