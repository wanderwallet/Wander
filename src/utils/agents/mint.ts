import { gql } from "~gateways/api";
import { AO_PROCESS_MINT_QUERY, AO_PROCESS_MINT_WITH_NONCE_QUERY } from "./queries";
import { getAOYieldActiveAgent, getAOYieldAgentInfo, getArweave, updateAOYieldAgent } from "./utils";
import { getActiveAddress } from "~wallets/wallets.utils";
import BigNumber from "bignumber.js";
import { AO_PROCESS_ID, defaultTokens, fetchTokenBalance, getTagValue, sendAoTransfer } from "~tokens/aoTokens/ao";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { QueryClient } from "@tanstack/react-query";
import { defaultOptions } from "~tokens/hooks";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { ONE_HOUR_MS } from "./constants";
import type { AOYieldAgent, AOYieldAgentInfo } from "./types";

const queryClient = new QueryClient();
let isSwapExecutionInProgress = false;

export interface MintTransaction {
  id: string;
  timestamp: number;
  total?: number;
  nonce?: number;
}

export interface ParsedMintData {
  recipient: string;
  amount: string;
  user: string;
  token: string;
}

interface MintQuantityResult {
  quantity: string;
  swapDateFrom: number;
  swapDateTo: number;
}

function sortAscending(a: MintTransaction, b: MintTransaction): number {
  return a.timestamp - b.timestamp;
}

/**
 * Normalizes a timestamp to the start of the day.
 * @param timestamp - The timestamp to normalize.
 * @returns The normalized timestamp.
 */
function normalizeToStartOfDay(timestamp: number): number {
  return new Date(timestamp).setHours(0, 0, 0, 0);
}

/**
 * Creates a transaction object from a GraphQL edge.
 * @param edge - The GraphQL edge.
 * @returns The transaction object.
 */
function createTransactionFromEdge(edge: any): MintTransaction {
  const tags = edge.node.tags;
  const total = getTagValue("Total", tags);
  const nonce = getTagValue("Nonce", tags);

  return {
    id: edge.node.id,
    timestamp: edge.node.block?.timestamp ? edge.node.block.timestamp * 1000 : Date.now(),
    total: Number(total),
    nonce: Number(nonce),
  };
}

/**
 * Builds a transaction map from edges.
 * @param edges - The edges to build the transaction map from.
 * @returns The transaction map.
 */
function buildTransactionMap(edges: any[]): Map<string, MintTransaction> {
  const transactionMap = new Map<string, MintTransaction>();

  edges.forEach((edge) => {
    const transaction = createTransactionFromEdge(edge);

    if (!transactionMap.has(edge.node.id)) {
      transactionMap.set(edge.node.id, transaction);
    }
  });

  return transactionMap;
}

export async function fetchAllMintTransactions(): Promise<MintTransaction[]> {
  const response = await gql(AO_PROCESS_MINT_QUERY);
  const edges = response?.data?.transactions?.edges || [];

  const transactionMap = buildTransactionMap(edges);

  return Array.from(transactionMap.values()).sort(sortAscending);
}

export async function fetchMintTransactionsByNonce(nonce: number): Promise<MintTransaction[]> {
  const response = await gql(AO_PROCESS_MINT_WITH_NONCE_QUERY, { nonce });
  const edges = response?.data?.transactions?.edges || [];

  const transactionMap = buildTransactionMap(edges);

  return Array.from(transactionMap.values());
}

export async function checkIfMintingIsPaused(): Promise<boolean> {
  const transactions = await fetchAllMintTransactions();
  const now = Date.now();
  const today = normalizeToStartOfDay(now);
  const yesterday = normalizeToStartOfDay(now - 24 * 60 * 60 * 1000);

  const hasTransactionToday = transactions.some((tx) => normalizeToStartOfDay(tx.timestamp) === today);
  const hasTransactionYesterday = transactions.some((tx) => normalizeToStartOfDay(tx.timestamp) === yesterday);

  // If there's a transaction today but none yesterday, minting is not paused
  if (hasTransactionToday && !hasTransactionYesterday) {
    return false;
  }

  // If there are no transactions today or yesterday, minting is paused
  return !hasTransactionToday && !hasTransactionYesterday;
}

export async function fetchRawMintData(transactionId: string): Promise<string> {
  const arweave = getArweave();
  const response = await arweave.api.get(transactionId);
  return response.data;
}

export async function parseRawMintData(transactionId: string): Promise<ParsedMintData[]> {
  const rawData = await fetchRawMintData(transactionId);
  const lines = rawData.split("\n");

  return lines.map((line: string) => {
    const [recipient, amount, user, token] = line.split(",");
    return { recipient, amount, user, token };
  });
}

/**
 * Processes a single mint transaction for mint quantity calculation.
 * @param transaction - The transaction to process.
 * @param address - The address to process the transaction for.
 * @returns The mint quantity.
 */
async function processSingleMintTransaction(transaction: MintTransaction, address: string): Promise<BigNumber> {
  const data = await parseRawMintData(transaction.id);
  const mint = data.find((mint) => mint.recipient === address);
  return mint ? BigNumber(mint.amount) : BigNumber(0);
}

/**
 * Processes transactions with nonce for mint quantity calculation.
 * @param transaction - The transaction to process.
 * @param address - The address to process the transaction for.
 * @returns The mint quantity.
 */
async function processNoncedMintTransactions(transaction: MintTransaction, address: string): Promise<BigNumber> {
  const mintTransactions = await fetchMintTransactionsByNonce(transaction.nonce!);

  for (const tx of mintTransactions) {
    const data = await parseRawMintData(tx.id);
    const mint = data.find((mint) => mint.recipient === address);
    if (mint) {
      return BigNumber(mint.amount);
    }
  }

  return BigNumber(0);
}

export async function calculateMintQuantityForDateRange(
  address: string,
  startDate: number,
  endDate: number,
): Promise<MintQuantityResult> {
  const normalizedStartDate = normalizeToStartOfDay(startDate);
  const normalizedEndDate = normalizeToStartOfDay(endDate);

  const transactions = await fetchAllMintTransactions();
  const transactionsInRange = transactions.filter((tx) => {
    const txDate = normalizeToStartOfDay(tx.timestamp);
    return txDate >= normalizedStartDate && txDate <= normalizedEndDate;
  });

  if (!transactionsInRange.length) {
    return {
      quantity: "0",
      swapDateFrom: normalizedStartDate,
      swapDateTo: normalizedEndDate,
    };
  }

  const actualStartDate = normalizeToStartOfDay(transactionsInRange[0].timestamp);
  const actualEndDate = normalizeToStartOfDay(transactionsInRange[transactionsInRange.length - 1].timestamp);

  let mintedQuantity = BigNumber(0);

  for (const transaction of transactionsInRange) {
    const transactionAmount =
      transaction.total === 1
        ? await processSingleMintTransaction(transaction, address)
        : await processNoncedMintTransactions(transaction, address);

    mintedQuantity = mintedQuantity.plus(transactionAmount);
  }

  return {
    quantity: mintedQuantity.toFixed(0, BigNumber.ROUND_FLOOR),
    swapDateFrom: actualStartDate,
    swapDateTo: actualEndDate,
  };
}

/**
 * Validates agent eligibility for swap.
 * @param activeAgent - The active agent.
 * @returns True if the agent is eligible for swap, false otherwise.
 */
async function validateAgentForSwap(activeAgent: any): Promise<boolean> {
  if (normalizeToStartOfDay(activeAgent.endDate) < normalizeToStartOfDay(Date.now())) {
    if (activeAgent.status === "Active") {
      await updateAOYieldAgent(activeAgent.id, { status: "Completed" });
    }
    log(LOG_GROUP.AGENTS, "Agent running time has ended");
    return false;
  }
  return true;
}

/**
 * Checks if swap is already in progress or completed.
 * @param agentInfo - The agent info.
 * @returns True if the swap is already in progress or completed, false otherwise.
 */
function shouldSkipSwap(agentInfo: AOYieldAgentInfo): boolean {
  const { swapInProgress, lastSwapTimestamp, swappedUpToDate } = agentInfo;

  if (
    (swapInProgress && !lastSwapTimestamp) ||
    (swapInProgress && lastSwapTimestamp && Date.now() - lastSwapTimestamp <= ONE_HOUR_MS)
  ) {
    log(LOG_GROUP.AGENTS, "Swap already in progress");
    return true;
  }

  if (swappedUpToDate && normalizeToStartOfDay(swappedUpToDate) === normalizeToStartOfDay(Date.now())) {
    log(LOG_GROUP.AGENTS, "Agent has already swapped up to date");
    return true;
  }

  return false;
}

/**
 * Calculates swap dates.
 * @param swappedUpToDate - The swapped up to date.
 * @returns The swap dates.
 */
function calculateSwapDates(swappedUpToDate: number | null): { from: number; to: number } {
  const now = Date.now();
  return {
    from: swappedUpToDate ? normalizeToStartOfDay(swappedUpToDate) : normalizeToStartOfDay(now),
    to: normalizeToStartOfDay(now),
  };
}

/**
 * Validates token balance for swap.
 * @param activeAddress - The active address.
 * @param swapQuantity - The swap quantity.
 * @returns True if the token balance is valid, false otherwise.
 */
async function validateTokenBalanceForSwap(activeAddress: string, swapQuantity: string): Promise<boolean> {
  const token = defaultTokens[1];
  const balance = await queryClient.fetchQuery({
    queryKey: ["tokenBalance", AO_PROCESS_ID, activeAddress],
    queryFn: async () => {
      try {
        const balance = await fetchTokenBalance(token, activeAddress);
        return balance || "0";
      } catch {
        return "0";
      }
    },
    ...defaultOptions,
  });

  log(LOG_GROUP.AGENTS, { balance });

  if (balance && BigNumber(balance).shiftedBy(12).lt(swapQuantity)) {
    log(LOG_GROUP.AGENTS, "Not enough AO tokens to swap");
    return false;
  }

  return true;
}

/**
 * Executes the token swap.
 * @param activeAgent - The active agent.
 * @param swapQuantity - The swap quantity.
 * @param swapDateFrom - The swap date from.
 * @param swapDateTo - The swap date to.
 * @param activeAddress - The active address.
 */
async function executeTokenSwap(
  activeAgent: AOYieldAgent,
  swapQuantity: string,
  swapDateFrom: number,
  swapDateTo: number,
  activeAddress: string,
): Promise<void> {
  log(LOG_GROUP.AGENTS, "Swapping AO tokens to agent: ", activeAgent.id);

  const ao = connect(defaultConfig);
  const messageId = await sendAoTransfer(ao, AO_PROCESS_ID, activeAgent.id, swapQuantity, [
    { name: "X-Swap-Date-From", value: swapDateFrom.toString() },
    { name: "X-Swap-Date-To", value: swapDateTo.toString() },
  ]);

  if (!messageId) {
    log(LOG_GROUP.AGENTS, "Failed to transfer AO tokens to agent: ", activeAgent.id);
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: ["tokenBalance", AO_PROCESS_ID, activeAddress],
  });
}

export async function executeAutomaticSwapIfNeeded(): Promise<void> {
  if (isSwapExecutionInProgress) return;

  isSwapExecutionInProgress = true;

  try {
    const activeAddress = await getActiveAddress();
    if (!activeAddress) {
      log(LOG_GROUP.AGENTS, "No active address found");
      return;
    }

    const activeAgent = await getAOYieldActiveAgent();
    if (!activeAgent) {
      log(LOG_GROUP.AGENTS, "No active agent found");
      return;
    }

    // Validate agent eligibility
    if (!(await validateAgentForSwap(activeAgent))) {
      return;
    }

    // Fetch agent info
    const agentInfo = await queryClient.fetchQuery({
      queryKey: ["ao-yield-agent-info", activeAgent.id],
      queryFn: () => getAOYieldAgentInfo(activeAgent.id),
      staleTime: 60_000,
      gcTime: 60_000,
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    // Check if swap should be skipped
    if (shouldSkipSwap(agentInfo)) return;

    // Calculate swap dates
    const { from: swapDateFrom, to: swapDateTo } = calculateSwapDates(agentInfo.swappedUpToDate);

    // Calculate mint quantity for the date range
    const mintResult = await calculateMintQuantityForDateRange(activeAddress, swapDateFrom, swapDateTo);
    const { quantity: mintedQuantity, swapDateFrom: actualDateFrom, swapDateTo: actualDateTo } = mintResult;

    // Calculate swap quantity
    const swapQuantity = BigNumber(mintedQuantity)
      .multipliedBy(activeAgent.conversionPercentage)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_FLOOR);

    log(LOG_GROUP.AGENTS, { mintedQuantity, swapQuantity });

    if (BigNumber(swapQuantity).eq("0")) {
      log(LOG_GROUP.AGENTS, "No swap needed");
      return;
    }

    // Validate token balance
    if (!(await validateTokenBalanceForSwap(activeAddress, swapQuantity))) return;

    // Execute the swap
    await executeTokenSwap(activeAgent, swapQuantity, actualDateFrom, actualDateTo, activeAddress);
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error performing swap: ", error);
  } finally {
    isSwapExecutionInProgress = false;
  }
}
