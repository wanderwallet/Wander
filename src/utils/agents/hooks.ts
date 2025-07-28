import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAODelegationInfo,
  getAOYieldAgentInfo,
  getAOYieldAgents,
  getWanderFee,
  processTransactions,
  tokenIdInfoMap,
} from "./utils";
import type {
  AOYieldAgent,
  AOYieldAgentCreate,
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
import { checkIfMintingIsPaused, checkIfAgentHasRecentSwaps } from "./swap";
import dayjs from "dayjs";
import browser from "webextension-polyfill";
import type { DefiFeeDetails } from "~utils/tier/types";

interface UseAOYieldAgentsProps {
  status?: AOYieldAgentStatus;
  showNewAtTop?: boolean;
}

export function useAOYieldAgents({ status, showNewAtTop = false }: UseAOYieldAgentsProps = {}) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agents] = useStorage<AOYieldAgent[]>(
    {
      key: `ao_yield_agents_${activeAddress}`,
      instance: ExtensionStorage,
    },
    [],
  );

  return useMemo(() => {
    if (!agents.length) return [];

    const filteredAgents = status ? agents.filter((agent) => agent.status === status) : agents;
    return showNewAtTop ? [...filteredAgents].reverse() : filteredAgents;
  }, [agents, status, showNewAtTop]);
}

export function useAOYieldLatestAgent() {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agents] = useStorage<AOYieldAgent[]>(
    {
      key: `ao_yield_agents_${activeAddress}`,
      instance: ExtensionStorage,
    },
    [],
  );

  return useMemo(() => {
    if (!agents.length) return undefined;

    return agents.find((agent) => agent.status === "Active") || agents[agents.length - 1];
  }, [agents]);
}

export function useAOYieldAgent(agentId: string, status?: AOYieldAgentStatus) {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [agents] = useStorage<AOYieldAgent[]>(
    {
      key: `ao_yield_agents_${activeAddress}`,
      instance: ExtensionStorage,
    },
    [],
  );

  return useMemo(() => {
    if (!agents.length) return undefined;

    if (!status) {
      return agents.find((agent) => agent.id === agentId);
    }
    return agents.find((agent) => agent.id === agentId && agent.status === status);
  }, [agents, agentId, status]);
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

      // sort by timestamp in descending order (newest first)
      filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);

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
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });

  return useQuery<MintingStatus>({
    queryKey: ["ao-minting-status"],
    queryFn: async () => {
      const [isPaused, wasStoredAsPaused] = await Promise.all([
        checkIfMintingIsPaused(),
        ExtensionStorage.get<boolean>("ao_minting_paused"),
      ]);

      // If state changed, update storage and handle notifications
      if (wasStoredAsPaused !== isPaused) {
        await ExtensionStorage.set("ao_minting_paused", isPaused);

        // If minting just resumed (was paused, now active), check agent activity too
        if (wasStoredAsPaused === true && isPaused === false) {
          // Get active agent to check its swap activity
          const agents = await getAOYieldAgents(activeAddress);
          const activeAgent = agents.find((agent) => agent.status === "Active");

          if (activeAgent) {
            // Check if agent has recent swaps to confirm full functionality
            const hasRecentSwaps = await checkIfAgentHasRecentSwaps(activeAgent.id);

            // Only show resume notification if agent is also making swaps
            if (hasRecentSwaps) {
              await ExtensionStorage.set("show_mint_resumed", true);
            }
          }
        }
      }

      return isPaused ? "Paused" : "Active";
    },
    enabled: !!activeAddress,
    ...defaultOptions,
  });
}

export function useAODelegationInfo() {
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });

  return useQuery<{ hasAODelegation: boolean }>({
    queryKey: ["ao-delegation-info", activeAddress],
    queryFn: () => getAODelegationInfo(activeAddress),
    refetchInterval: 60_000,
    staleTime: 60_000,
    gcTime: 60_000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    enabled: !!activeAddress,
  });
}

export function useAOYieldAgentProperties(agent: AOYieldAgentCreate | AOYieldAgent, feeDetails?: DefiFeeDetails) {
  const properties = useMemo(() => {
    if (!agent) return [];

    const { conversionPercentage, startDate, endDate, runIndefinitely, slippage } = agent;
    const asset = "asset" in agent ? agent.asset : tokenIdInfoMap[agent?.tokenOut];
    const days = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
    const runningTime = runIndefinitely ? "∞ days" : `${days} ${days === 1 ? "day" : "days"}`;
    const endDateFormatted = runIndefinitely ? "∞" : dayjs(endDate).format("MMM D, YYYY");

    const properties: Array<{ name: string; value: string; originalFeePercent?: string; feeHasChanged?: boolean }> = [
      { name: "daily_conversion", value: `${conversionPercentage}% of AO earnings` },
      { name: "buy_asset", value: asset?.ticker || "" },
      { name: "running_time", value: runningTime },
      { name: "start_date", value: dayjs(startDate).format("MMM D, YYYY") },
      { name: "end_date", value: endDateFormatted },
      { name: "slippage", value: `${slippage}%` },
    ];

    if (feeDetails) {
      properties.push({
        name: "fee",
        value: browser.i18n.getMessage("percentage_of_each_conversion", [feeDetails.finalFeePercent]),
        originalFeePercent: feeDetails.originalFeePercent,
        feeHasChanged: feeDetails.feeHasChanged,
      });
    }

    return properties;
  }, [agent]);

  return properties;
}

export function useWanderFee() {
  return useQuery<string>({
    queryKey: ["wander-fee"],
    queryFn: () => getWanderFee(),
    ...defaultOptions,
  });
}
