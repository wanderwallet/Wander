import { gql } from "~gateways/api";
import {
  AO_PROCESS_MINT_QUERY,
  AO_PROCESS_MINT_WITH_NONCE_QUERY,
  AO_YIELD_AGENT_RECENT_TX_QUERY,
  SWAP_SUCCESS_QUERY_WITH_CURSOR,
} from "./queries";
import {
  getAOYieldAgentInfo,
  getArweave,
  getRecentTxs,
  setRecentTxs,
  updateAOYieldAgent,
  getAOYieldAgents,
} from "./utils";
import { getActiveAddress } from "~wallets/wallets.utils";
import { getWallets } from "~wallets";
import BigNumber from "bignumber.js";
import {
  AO_PROCESS_ID,
  defaultTokens,
  fetchTokenBalance,
  getTagValue,
  sendAoTransferForWallet,
} from "~tokens/aoTokens/ao";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { QueryClient } from "@tanstack/react-query";
import { defaultOptions } from "~tokens/hooks";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  AO_YIELD_AGENT_ALARM_NAME,
  AO_YIELD_AGENT_LAST_SWAP_DATE_KEY,
  AO_YIELD_AGENT_RECENT_TXS_CHECK_ALARM_NAME,
  AO_YIELD_AGENT_RECENT_TXS_CHECK_IN_PROGRESS_KEY,
  AO_YIELD_AGENT_SWAP_IN_PROGRESS_KEY,
  ONE_HOUR_MS,
  AO_YIELD_AGENT_COOLDOWN_KEY,
} from "./constants";
import type { AOYieldAgent, AOYieldAgentInfo, MintQuantityResult, MintTransaction, ParsedMintData } from "./types";
import type { DecodedTag } from "~api/modules/sign/tags";
import { ExtensionStorage } from "~utils/storage";
import browser from "webextension-polyfill";
import { EventType, trackEvent } from "~utils/analytics";
import { getSetting } from "~settings";

const queryClient = new QueryClient();
let isSwapExecutionInProgress = false;
let isSchedulingInProgress = false;
let isRecentTxCheckInProgress = false;

async function startSwapInProgress(lockTimestamp: number) {
  await ExtensionStorage.set(AO_YIELD_AGENT_SWAP_IN_PROGRESS_KEY, lockTimestamp);
}

async function clearSwapInProgress() {
  await ExtensionStorage.remove(AO_YIELD_AGENT_SWAP_IN_PROGRESS_KEY);
}

async function addCooldown() {
  await ExtensionStorage.set(`${AO_YIELD_AGENT_COOLDOWN_KEY}`, Date.now() + 5 * 60 * 1000);
}

async function isCooldownActive() {
  const cooldownUntil = await ExtensionStorage.get<number>(AO_YIELD_AGENT_COOLDOWN_KEY);
  if (cooldownUntil && cooldownUntil > Date.now()) {
    return true;
  }
  return false;
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

/**
 * Checks if the agent has recent swap transactions (within last 24 hours)
 * This ensures the agent is not only receiving AO tokens but also swapping them
 */
export async function checkIfAgentHasRecentSwaps(agentId: string): Promise<boolean> {
  if (!agentId) return false;

  try {
    const response = await gql(SWAP_SUCCESS_QUERY_WITH_CURSOR, { agentId, after: "" });
    const edges = response?.data?.transactions?.edges || [];

    if (edges.length === 0) return false;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Check if there are any swap transactions within the last 24 hours
    const hasRecentSwaps = edges.some((edge) => {
      const timestamp = edge.node.block?.timestamp ? edge.node.block.timestamp * 1000 : Date.now();
      return timestamp > oneDayAgo;
    });

    return hasRecentSwaps;
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error checking agent recent swaps:", error);
    return false;
  }
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
async function validateAgentForSwap(activeAgent: AOYieldAgent): Promise<boolean> {
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
  const { processedUpToDate, swappedUpToDate } = agentInfo;

  if (processedUpToDate && normalizeToStartOfDay(processedUpToDate) === normalizeToStartOfDay(Date.now())) {
    log(LOG_GROUP.AGENTS, "Swap already processed up to date today");
    return true;
  }

  if (swappedUpToDate && normalizeToStartOfDay(swappedUpToDate) === normalizeToStartOfDay(Date.now())) {
    log(LOG_GROUP.AGENTS, "Agent has already swapped up to date today");
    return true;
  }

  return false;
}

/**
 * Calculates swap dates.
 * @param agentInfo - The agent info.
 * @returns The swap dates.
 */
function calculateSwapDates(agentInfo: AOYieldAgentInfo): { from: number; to: number } {
  let swapDateFrom = normalizeToStartOfDay(agentInfo.startDate);
  const processedUpToDate = agentInfo.processedUpToDate || agentInfo.swappedUpToDate;
  if (processedUpToDate) {
    // If the agent has been processed up to a certain date, we need to start from the next day
    swapDateFrom = normalizeToStartOfDay(processedUpToDate) + 24 * 60 * 60 * 1000;
  }

  const swapDateTo = normalizeToStartOfDay(Date.now());

  return { from: swapDateFrom, to: swapDateTo };
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
 * Gets the last swap date for a specific wallet address
 * @param walletAddress - The wallet address
 * @returns The last swap timestamp or undefined
 */
async function getLastSwapDateForWallet(walletAddress: string): Promise<number | undefined> {
  return await ExtensionStorage.get<number>(`${AO_YIELD_AGENT_LAST_SWAP_DATE_KEY}_${walletAddress}`);
}

/**
 * Sets the last swap date for a specific wallet address
 * @param walletAddress - The wallet address
 * @param timestamp - The swap timestamp
 */
async function setLastSwapDateForWallet(walletAddress: string, timestamp: number): Promise<void> {
  await ExtensionStorage.set(`${AO_YIELD_AGENT_LAST_SWAP_DATE_KEY}_${walletAddress}`, timestamp);
}

/**
 * Checks if a wallet has already swapped today
 * @param walletAddress - The wallet address to check
 * @returns True if wallet has already swapped today
 */
async function hasWalletSwappedToday(walletAddress: string): Promise<boolean> {
  const lastSwapDate = await getLastSwapDateForWallet(walletAddress);
  if (lastSwapDate) {
    return normalizeToStartOfDay(lastSwapDate) === normalizeToStartOfDay(Date.now());
  }
  return false;
}

/**
 * Executes the token swap.
 * @param activeAgent - The active agent.
 * @param swapQuantity - The swap quantity.
 * @param swapDateFrom - The swap date from.
 * @param swapDateTo - The swap date to.
 * @param walletAddress - The wallet address to use for the swap.
 */
async function executeTokenSwap(
  activeAgent: AOYieldAgent,
  swapQuantity: string,
  swapDateFrom: number,
  swapDateTo: number,
  walletAddress: string,
): Promise<string> {
  log(LOG_GROUP.AGENTS, "Transferring AO tokens to agent: ", activeAgent.id, "from wallet:", walletAddress);

  const ao = connect(defaultConfig);
  const messageId = await sendAoTransferForWallet(
    ao,
    AO_PROCESS_ID,
    activeAgent.id,
    swapQuantity,
    [
      { name: "X-Swap-Date-From", value: swapDateFrom.toString() },
      { name: "X-Swap-Date-To", value: swapDateTo.toString() },
    ],
    walletAddress,
  );

  if (!messageId) {
    log(LOG_GROUP.AGENTS, "Failed to transfer AO tokens to agent: ", activeAgent.id, "from wallet:", walletAddress);
    return;
  }

  try {
    const { Error, Messages } = await ao.result({ message: messageId, process: AO_PROCESS_ID });
    const hasValidTag = Messages?.some((message) =>
      message?.Tags?.some(
        (tag: DecodedTag) => tag.name === "Action" && (tag.value === "Debit-Notice" || tag.value === "Credit-Notice"),
      ),
    );

    if (Error || !hasValidTag) {
      log(LOG_GROUP.AGENTS, "Failed to transfer AO tokens to agent: ", activeAgent.id, "from wallet:", walletAddress);
      return;
    }
  } catch {}

  log(LOG_GROUP.AGENTS, "Transferred AO tokens to agent: ", activeAgent.id, "from wallet:", walletAddress);

  // Set wallet-specific last swap date
  await setLastSwapDateForWallet(walletAddress, swapDateTo);

  await queryClient.invalidateQueries({ queryKey: ["tokenBalance", AO_PROCESS_ID, walletAddress] });

  return messageId;
}

/**
 * Processes automatic swap for a single agent
 * @param agent - The agent to process
 * @param walletAddress - The wallet address that owns the agent
 */
async function processAgentSwap(agent: AOYieldAgent, walletAddress: string): Promise<void> {
  try {
    // Validate agent eligibility
    if (!(await validateAgentForSwap(agent))) {
      return;
    }

    // Fetch fresh agent info
    const agentInfo = await queryClient.fetchQuery({
      queryKey: ["ao-yield-agent-info", agent.id],
      queryFn: () => getAOYieldAgentInfo(agent.id),
      staleTime: 0, // Force fresh data
      gcTime: 0,
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    if (!agentInfo) {
      log(LOG_GROUP.AGENTS, "Agent info not found");
      return;
    }

    // Check if swap should be skipped
    if (shouldSkipSwap(agentInfo)) {
      return;
    }

    // Calculate swap dates
    const { from: swapDateFrom, to: swapDateTo } = calculateSwapDates(agentInfo);

    // Calculate mint quantity for the date range
    const mintResult = await calculateMintQuantityForDateRange(walletAddress, swapDateFrom, swapDateTo);
    const { quantity: mintedQuantity, swapDateFrom: actualDateFrom, swapDateTo: actualDateTo } = mintResult;

    // Calculate swap quantity
    const swapQuantity = BigNumber(mintedQuantity)
      .multipliedBy(agent.conversionPercentage)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_FLOOR);

    log(LOG_GROUP.AGENTS, { agent: agent.id, walletAddress, mintedQuantity, swapQuantity });

    if (BigNumber(swapQuantity).eq("0")) {
      log(LOG_GROUP.AGENTS, "No swap needed for agent:", agent.id);
      return;
    }

    // Validate token balance
    if (!(await validateTokenBalanceForSwap(walletAddress, swapQuantity))) {
      return;
    }

    // Execute the swap
    const messageId = await executeTokenSwap(agent, swapQuantity, actualDateFrom, actualDateTo, walletAddress);
    if (!messageId) {
      return;
    }

    // first we check if we are allowed to collect data
    const enabled = await getSetting("analytics").getValue();
    if (enabled) {
      const recentTxs = await getRecentTxs();
      await setRecentTxs([...recentTxs, { id: messageId, timestamp: Date.now(), queryCount: 0 }]);

      // Schedule staggered checks for transaction success
      [0.5, 1, 1.5, 2].forEach((delay) => {
        browser.alarms.create(AO_YIELD_AGENT_RECENT_TXS_CHECK_ALARM_NAME, { when: Date.now() + delay * 60 * 1000 });
      });
    }

    log(LOG_GROUP.AGENTS, "Successfully processed swap for agent:", agent.id, "wallet:", walletAddress);
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error processing agent swap:", agent.id, "wallet:", walletAddress, error);
  }
}

export async function executeAutomaticSwapIfNeeded(): Promise<void> {
  // TODO: decide keep or remove this cooldown ?
  if (await isCooldownActive()) {
    log(LOG_GROUP.AGENTS, "Cooldown is active, skipping swap");
    return;
  }

  if (isSwapExecutionInProgress) return;

  isSwapExecutionInProgress = true;

  try {
    // Atomic check-and-set for swap lock
    const lockTimestamp = Date.now();
    const currentLock = await ExtensionStorage.get<number>(AO_YIELD_AGENT_SWAP_IN_PROGRESS_KEY);

    if (currentLock) {
      // If swap has been in progress for more than 1 hour, consider it failed and allow retry
      if (lockTimestamp - currentLock < ONE_HOUR_MS) {
        log(LOG_GROUP.AGENTS, "Swap already in progress");
        return;
      } else {
        log(LOG_GROUP.AGENTS, "Clearing stale swap in progress flag");
      }
    }

    // Try to acquire the lock atomically
    await startSwapInProgress(lockTimestamp);

    // Double-check that we actually got the lock (handle race conditions)
    const verifyLock = await ExtensionStorage.get<number>(AO_YIELD_AGENT_SWAP_IN_PROGRESS_KEY);
    if (verifyLock !== lockTimestamp) {
      log(LOG_GROUP.AGENTS, "Failed to acquire swap lock - another process is running");
      return;
    }

    // Get all wallets
    const wallets = await getWallets();
    if (!wallets || wallets.length === 0) {
      log(LOG_GROUP.AGENTS, "No wallets found");
      return;
    }

    log(LOG_GROUP.AGENTS, `Processing agents for ${wallets.length} wallets`);

    // Process agents for each wallet
    for (const wallet of wallets) {
      if (wallet.type === "hardware") continue;

      try {
        // Check if this wallet has already swapped today
        if (await hasWalletSwappedToday(wallet.address)) {
          log(LOG_GROUP.AGENTS, `Wallet ${wallet.address} already swapped today`);
          continue;
        }

        // Get active agents for this wallet
        const agents = await getAOYieldAgents(wallet.address, "Active");

        if (agents.length === 0) {
          log(LOG_GROUP.AGENTS, `No active agents found for wallet: ${wallet.address}`);
          continue;
        }

        log(LOG_GROUP.AGENTS, `Processing active agent for wallet: ${wallet.address}`);

        // Process each agent for this wallet
        const activeAgent = agents[agents.length - 1];
        await processAgentSwap(activeAgent, wallet.address);
      } catch (error) {
        log(LOG_GROUP.AGENTS, `Error processing agents for wallet ${wallet.address}:`, error);
        // Continue processing other wallets even if one fails
        continue;
      }
    }
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error performing swap: ", error);
  } finally {
    await addCooldown();
    await clearSwapInProgress();
    isSwapExecutionInProgress = false;
  }
}

export async function checkIfRecentTxSwapSucceeded(): Promise<boolean> {
  try {
    const enabled = await getSetting("analytics").getValue();
    if (!enabled) {
      await browser.alarms.clear(AO_YIELD_AGENT_RECENT_TXS_CHECK_ALARM_NAME);
      return;
    }

    if (isRecentTxCheckInProgress) return;

    isRecentTxCheckInProgress = true;

    const activeAddress = await getActiveAddress();
    if (!activeAddress) {
      log(LOG_GROUP.AGENTS, "No active address found");
      return;
    }

    const checkInProgress = await ExtensionStorage.get<boolean>(AO_YIELD_AGENT_RECENT_TXS_CHECK_IN_PROGRESS_KEY);
    if (checkInProgress) {
      log(LOG_GROUP.AGENTS, "Recent txs check already in progress");
      return;
    }

    await ExtensionStorage.set(AO_YIELD_AGENT_RECENT_TXS_CHECK_IN_PROGRESS_KEY, true);

    let recentTxs = await getRecentTxs();
    if (recentTxs.length === 0) {
      log(LOG_GROUP.AGENTS, "No recent txs found");
      return;
    }

    const response = await gql(AO_YIELD_AGENT_RECENT_TX_QUERY, { parentTxIds: recentTxs });
    const edges = response?.data?.transactions?.edges || [];

    if (edges.length === 0) {
      log(LOG_GROUP.AGENTS, "No recent txs found");
      return;
    }

    log(LOG_GROUP.AGENTS, "Recent txs found: ", recentTxs.length);

    const foundTxIds = new Set<string>();

    try {
      for (const edge of edges) {
        const tags = edge.node.tags;
        const txId = getTagValue("Pushed-For", tags);
        const buyAsset = getTagValue("Token-Out", tags);
        const sellAmount = getTagValue("Amount-In", tags);
        const buyAmount = getTagValue("Amount-Out", tags);
        const dexUsed = getTagValue("Dex", tags);
        const wanderFee = getTagValue("Swap-Fee", tags);

        if (foundTxIds.has(txId)) continue;
        foundTxIds.add(txId);

        await trackEvent(EventType.AO_YIELD_AGENT_TRANSACTION, {
          buyAsset,
          sellAmount,
          buyAmount,
          dexUsed,
          wanderFee,
        });
      }
    } catch (error) {
      log(LOG_GROUP.AGENTS, "Error tracking recent txs: ", error);
    }

    recentTxs = await getRecentTxs();
    const remainingTxs = recentTxs.filter((tx) => !foundTxIds.has(tx.id) || tx.queryCount >= 8);
    log(LOG_GROUP.AGENTS, "Remaining txs: ", remainingTxs.length);
    if (remainingTxs.length === 0) {
      await browser.alarms.clear(AO_YIELD_AGENT_RECENT_TXS_CHECK_ALARM_NAME);
    }
    await setRecentTxs(remainingTxs.map((tx) => ({ ...tx, queryCount: tx.queryCount + 1 })));
  } catch {
    log(LOG_GROUP.AGENTS, "Error checking recent txs");
  } finally {
    await ExtensionStorage.remove(AO_YIELD_AGENT_RECENT_TXS_CHECK_IN_PROGRESS_KEY);
    isRecentTxCheckInProgress = false;
  }
}

export async function scheduleSwapExecution() {
  if (isSchedulingInProgress) return;

  isSchedulingInProgress = true;

  try {
    const alarms = await browser.alarms.get(AO_YIELD_AGENT_ALARM_NAME);
    if (alarms) return;

    browser.alarms.create(AO_YIELD_AGENT_ALARM_NAME, { when: Date.now() });
  } finally {
    isSchedulingInProgress = false;
  }
}
