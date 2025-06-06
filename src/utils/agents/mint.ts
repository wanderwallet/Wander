import { gql } from "~gateways/api";
import { AO_PROCESS_MINT_QUERY } from "./queries";
import { getAOYieldActiveAgent, getArweave, updateAOYieldAgent } from "./utils";
import { getActiveAddress } from "~wallets/wallets.utils";
import BigNumber from "bignumber.js";
import { AO_PROCESS_ID, defaultTokens, fetchTokenBalance, sendAoTransfer } from "~tokens/aoTokens/ao";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import { QueryClient } from "@tanstack/react-query";
import { defaultOptions } from "~tokens/hooks";
import { log, LOG_GROUP } from "~utils/log/log.utils";

const queryClient = new QueryClient();
let isPerformSwapRunning = false;

export interface MintTransaction {
  id: string;
  timestamp: number;
}

export interface MintData {
  recipient: string;
  amount: number;
  user: string;
  token: string;
}

function getDate(timestamp: number) {
  return new Date(timestamp).setHours(0, 0, 0, 0);
}

export async function getLatestMintTransactions(): Promise<MintTransaction[]> {
  const response = await gql(AO_PROCESS_MINT_QUERY);
  const edges = response?.data?.transactions?.edges || [];
  return edges.map((edge) => ({
    id: edge.node.id,
    timestamp: edge.node.block?.timestamp ? edge.node.block.timestamp * 1000 : Date.now(),
  }));
}

export async function isMintingPaused() {
  const transactions = await getLatestMintTransactions();
  const now = Date.now();
  const today = getDate(now);
  const yesterday = getDate(now - 24 * 60 * 60 * 1000);

  const hasTransactionToday = transactions.some((tx) => getDate(tx.timestamp) === today);
  const hasTransactionYesterday = transactions.some((tx) => getDate(tx.timestamp) === yesterday);

  // If there's a transaction today but none yesterday, minting is not paused
  if (hasTransactionToday && !hasTransactionYesterday) {
    return false;
  }

  // If there are no transactions today or yesterday, minting is paused
  return !hasTransactionToday && !hasTransactionYesterday;
}

export async function getMintData(transactionId: string) {
  const arweave = getArweave();
  const response = await arweave.api.get(transactionId);
  const data = await response.data;
  return data;
}

export async function getMintParsedData(transactionId: string): Promise<MintData[]> {
  const data = await getMintData(transactionId);
  const lines = data.split("\n");
  return lines.map((line: string) => {
    const [recipient, amount, user, token] = line.split(",");
    return { recipient, amount, user, token };
  });
}

export async function getMintQuantityForDay(address: string, targetDate: number) {
  targetDate = getDate(targetDate);

  const transactions = await getLatestMintTransactions();
  const transaction = transactions.find((tx) => getDate(tx.timestamp) === targetDate);

  if (!transaction) return 0;

  const data = await getMintParsedData(transaction.id);
  return data.find((mint) => mint.recipient === address)?.amount || 0;
}

export async function performSwapIfNeeded() {
  if (isPerformSwapRunning) return;
  isPerformSwapRunning = true;

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

    if (getDate(activeAgent.endDate) < getDate(Date.now())) {
      if (activeAgent.status === "Active") {
        await updateAOYieldAgent(activeAgent.id, { status: "Completed" });
      }
      log(LOG_GROUP.AGENTS, "Agent running time has ended");
      return;
    }

    const mintedQuantity = await getMintQuantityForDay(activeAddress, new Date().getTime());

    const swapQuantity = BigNumber(mintedQuantity)
      .multipliedBy(activeAgent.conversionPercentage)
      .dividedBy(100)
      .toFixed(0, BigNumber.ROUND_FLOOR);

    log(LOG_GROUP.AGENTS, { mintedQuantity, swapQuantity });

    if (BigNumber(swapQuantity).eq("0")) {
      log(LOG_GROUP.AGENTS, "No swap needed");
      return;
    }

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
      return;
    }

    log(LOG_GROUP.AGENTS, "Swapping AO tokens to agent: ", activeAgent.id);
    // TODO: remove this after testing
    return;

    const ao = connect(defaultConfig);
    const messageId = await sendAoTransfer(ao, AO_PROCESS_ID, activeAgent.id, swapQuantity, [
      { name: "X-Swap-Date-From", value: getDate(Date.now()).toString() },
      { name: "X-Swap-Date-To", value: getDate(Date.now()).toString() },
    ]);
    if (!messageId) {
      log(LOG_GROUP.AGENTS, "Failed to transfer AO tokens to agent: ", activeAgent.id);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["tokenBalance", AO_PROCESS_ID, activeAddress] });
  } catch (error) {
    log(LOG_GROUP.AGENTS, "Error performing swap: ", error);
  } finally {
    isPerformSwapRunning = false;
  }
}
