import { useCallback, useEffect, useState } from "react";
import { getAOYieldAgentInfo, getAOYieldAgents } from "./utils";
import type { AOYieldAgent, AOYieldAgentInfo, AOYieldAgentStatus, Tag } from "./types";
import { ExtensionStorage, useStorage } from "../storage";
import type GQLResultInterface from "ar-gql/dist/faces";
import { gql } from "~gateways/api";
import { retryWithDelay } from "~utils/promises/retry";
import { SWAP_SUCCESS_QUERY_WITH_CURSOR } from "./queries";
import { getTagValue } from "~tokens/aoTokens/ao";

export interface SwapSuccessTransaction {
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  wanderFee: string;
  timestamp: number;
  id: string;
  cursor: string;
}

export function useAOYieldAgents(status?: AOYieldAgentStatus) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agents, setAgents] = useState<AOYieldAgent[]>([]);

  useEffect(() => {
    getAOYieldAgents(activeAddress, status).then(setAgents);
  }, [activeAddress, status]);

  return agents;
}

export function useAOYieldActiveAgent() {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agent, setAgent] = useState<AOYieldAgent>();

  useEffect(() => {
    getAOYieldAgents(activeAddress, "Active").then((agents) => setAgent(agents[agents.length - 1]));
  }, [activeAddress]);

  return agent;
}

export function useAOYieldAgent(agentId: string, status?: AOYieldAgentStatus) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agent, setAgent] = useState<AOYieldAgent>();

  useEffect(() => {
    getAOYieldAgents(activeAddress, status).then((agents) => {
      const agent = agents.find((agent) => agent.id === agentId);
      setAgent(agent);
    });
  }, [activeAddress, agentId]);

  return agent;
}

export function useAOYieldAgentInfo(agentId: string) {
  const [info, setInfo] = useState<AOYieldAgentInfo>();

  useEffect(() => {
    if (!agentId) return;
    getAOYieldAgentInfo(agentId).then(setInfo);
  }, [agentId]);

  return info;
}

async function processTransactions(rawData: GQLResultInterface) {
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

export const useTransactions = (agentId: string, limit?: number) => {
  const defaultCursor = "";
  const defaultHasNextPage = true;

  const [count, setCount] = useState({ current: 0, actual: 0 });
  const [cursor, setCursor] = useState(defaultCursor);
  const [hasNextPage, setHasNextPage] = useState(defaultHasNextPage);
  const [transactions, setTransactions] = useState<SwapSuccessTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      if (!agentId || !hasNextPage) return;

      setLoading(true);

      const rawSwapSuccess = hasNextPage
        ? await retryWithDelay(async (attempt: number) => {
            const data = await gql(SWAP_SUCCESS_QUERY_WITH_CURSOR, { agentId, after: cursor });
            if (data?.data === null && (data as any)?.errors?.length > 0) {
              throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
            }
            return data;
          }, 2)
        : ({
            data: {
              transactions: {
                pageInfo: { hasNextPage: false },
                edges: [],
              },
            },
          } as GQLResultInterface);

      let processedTransactions = await processTransactions(rawSwapSuccess);

      setCursor((prev) => processedTransactions[processedTransactions.length - 1]?.cursor ?? prev);

      setHasNextPage(rawSwapSuccess?.data?.transactions?.pageInfo?.hasNextPage ?? true);

      const actualCount = processedTransactions.length;

      if (limit) {
        processedTransactions = processedTransactions.slice(0, limit);
      }

      setCount((prev) => ({
        current: prev.current + processedTransactions.length,
        actual: prev.actual + actualCount,
      }));

      const filteredTransactions = processedTransactions.reduce(
        (unique, transaction) => {
          const existingIndex = unique.findIndex((tx) => tx.id === transaction.id);
          if (existingIndex === -1) {
            unique.push(transaction);
          }
          return unique;
        },
        [...transactions],
      );

      setTransactions(filteredTransactions);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  }, [agentId, hasNextPage, transactions, limit]);

  useEffect(() => {
    setCursor(defaultCursor);
    setHasNextPage(defaultHasNextPage);
    setCount({ current: 0, actual: 0 });
    setTransactions([]);
    fetchTransactions();
  }, [agentId]);

  return {
    transactions,
    loading,
    hasNextPage,
    count,
    fetchTransactions,
  };
};
