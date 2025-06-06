import { useCallback, useEffect, useState } from "react";
import { getAOYieldAgentInfo, getAOYieldAgents, processTransactions } from "./utils";
import type {
  AOYieldAgent,
  AOYieldAgentInfo,
  AOYieldAgentStatus,
  MintingStatus,
  SwapSuccessTransaction,
} from "./types";
import { ExtensionStorage, useStorage } from "../storage";
import type GQLResultInterface from "ar-gql/dist/faces";
import { gql } from "~gateways/api";
import { retryWithDelay } from "~utils/promises/retry";
import { SWAP_SUCCESS_QUERY_WITH_CURSOR } from "./queries";
import { useQuery } from "@tanstack/react-query";
import { defaultOptions } from "~tokens/hooks";
import { checkIfMintingIsPaused } from "./mint";

interface UseAOYieldAgentsProps {
  status?: AOYieldAgentStatus;
  showNewAtTop?: boolean;
}

export function useAOYieldAgents({ status, showNewAtTop = false }: UseAOYieldAgentsProps = {}) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agents, setAgents] = useState<AOYieldAgent[]>([]);

  useEffect(() => {
    getAOYieldAgents(activeAddress, status).then((agents) => {
      if (showNewAtTop) {
        setAgents(agents.reverse());
      } else {
        setAgents(agents);
      }
    });
  }, [activeAddress, status]);

  return agents;
}

export function useAOYieldLatestAgent() {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agent, setAgent] = useState<AOYieldAgent>();

  useEffect(() => {
    getAOYieldAgents(activeAddress).then((agents) => setAgent(agents[agents.length - 1]));
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
  return useQuery<AOYieldAgentInfo>({
    queryKey: ["ao-yield-agent-info", agentId],
    queryFn: () => getAOYieldAgentInfo(agentId),
    enabled: !!agentId,
    refetchInterval: 60_000,
    staleTime: 60_000,
    gcTime: 60_000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });
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

export function useAOMintingStatus() {
  return useQuery<MintingStatus>({
    queryKey: ["ao-minting-status"],
    queryFn: async () => {
      const [isPaused, storedValue] = await Promise.all([
        checkIfMintingIsPaused(),
        ExtensionStorage.get<boolean>("ao_minting_paused"),
      ]);

      if (storedValue !== isPaused) {
        await ExtensionStorage.set("ao_minting_paused", isPaused);
      }

      return isPaused ? "Paused" : "Active";
    },
    ...defaultOptions,
  });
}
