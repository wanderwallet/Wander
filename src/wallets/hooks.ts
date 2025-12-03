import type { WalletInterface } from "~components/welcome/load/Migrate";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStorage } from "~utils/storage";
import { defaultGateway } from "~gateways/gateway";
import { ExtensionStorage } from "~utils/storage";
import { findGateway } from "~gateways/wayfinder";
import { retryWithDelay } from "~utils/promises/retry";
import type { HardwareApi } from "./hardware";
import type { StoredWallet } from "~wallets";
import Arweave from "arweave";
import { isPasswordFresh } from "./auth";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useNameServiceProfiles } from "~lib/nameservice";
import type GQLResultInterface from "ar-gql/dist/faces";
import { printTxWorkingGateways, txHistoryGateways } from "~gateways/gateway";
import {
  sortFn,
  processTransactions,
  type GroupedTransactions,
  type ExtendedTransaction,
  checkTransferStatus,
} from "~lib/transactions";
import {
  AO_RECEIVER_QUERY_WITH_CURSOR,
  AO_SENT_QUERY_WITH_CURSOR,
  AR_RECEIVER_QUERY_WITH_CURSOR,
  AR_SENT_QUERY_WITH_CURSOR,
  AO_LIQUIDOPS_RECEIVER_QUERY_WITH_CURSOR,
  PRINT_ARWEAVE_QUERY_WITH_CURSOR,
  AO_SENT_QUERY_FOR_TOKEN_WITH_CURSOR,
  AO_RECEIVER_QUERY_FOR_TOKEN_WITH_CURSOR,
  AO_LIQUIDOPS_RECEIVER_QUERY_FOR_TOKEN_WITH_CURSOR,
} from "~notifications/utils";
import { gql } from "~gateways/api";
import BigNumber from "bignumber.js";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { convertAnnouncementsToTransactions } from "~utils/announcements";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import {
  getPendingTokenTransactions,
  getPendingTransactions,
  mergeWithPending,
  removeTransferErrorTransactions,
} from "~utils/transactions";

/**
 * Wallets with details hook
 */
export function useWalletsDetails(wallets: JWKInterface[]) {
  const [walletDetails, setWalletDetails] = useState<WalletInterface[]>([]);

  const { data: profiles } = useNameServiceProfiles(walletDetails.map((w) => w.address));

  useAsyncEffect(async () => {
    const arweave = new Arweave(defaultGateway);
    const details: WalletInterface[] = [];

    // load wallet addresses
    for (const wallet of wallets) {
      const address = await arweave.wallets.getAddress(wallet);

      // skip already added wallets
      if (!!walletDetails.find((w) => w.address === address)) {
        continue;
      }

      details.push({ address });
    }

    // load ans labels
    try {
      for (const wallet of details) {
        const profile = profiles.find((p) => p.address === wallet.address);

        if (!profile?.name) continue;
        wallet.label = profile.name;
      }
    } catch {}

    // set details
    setWalletDetails(details);
  }, [wallets, profiles]);

  return walletDetails;
}

/**
 * Active wallet data (unencrypted)
 */
export function useActiveWallet() {
  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );

  // active wallet
  const wallet = useMemo(
    () =>
      wallets?.find(({ address }) => address === activeAddress) ||
      ({
        address: activeAddress,
        nickname: "",
        type: "local",
        keyfile: "",
      } satisfies StoredWallet),
    [activeAddress, wallets],
  );

  return wallet;
}

/**
 * Active address
 */
export function useActiveAddress() {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  return activeAddress;
}

export function useAllWallets() {
  const [wallets = [] as StoredWallet[]] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );

  return wallets;
}

export async function setActiveWallet(address?: string) {
  // remove if the address is undefined
  if (!address) {
    return await ExtensionStorage.remove("active_address");
  }

  const wallets = (await ExtensionStorage.get<StoredWallet[]>("wallets")) || [];

  // verify address
  if (!wallets.find((wallet) => wallet.address === address)) {
    return;
  }

  // save new active address
  await ExtensionStorage.set("active_address", address);
}

/**
 * Type of the current wallet (local/hardware => what type of API for the hardware)
 */
export function useHardwareApi() {
  // current wallet
  const wallet = useActiveWallet();

  // hardware wallet type
  const hardwareApi = useMemo<HardwareApi | false>(
    () => (wallet?.type === "hardware" && wallet.api) || false,
    [wallet],
  );

  return hardwareApi;
}

/**
 * Active wallet balance
 */
export function useBalance() {
  // grab address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const fetchBalance = useCallback(async () => {
    if (!activeAddress) return "0";

    const gateway = await findGateway({ random: true });
    const arweave = new Arweave(gateway);

    // fetch balance
    const winstonBalance = await arweave.wallets.getBalance(activeAddress);
    if (isNaN(+winstonBalance)) {
      throw new Error("Invalid balance returned");
    }
    const arBalance = arweave.ar.winstonToAr(winstonBalance);
    return arBalance;
  }, [activeAddress]);

  return useQuery({
    queryKey: ["arBalance", activeAddress],
    queryFn: async () => {
      const balance = await fetchBalance();
      return balance || "0";
    },
    refetchInterval: 300_000,
    staleTime: 300_000,
    gcTime: 300_000,
    retry: 3,
    select: (data) => data || "0",
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    enabled: !!activeAddress,
  });
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const handler = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    handler.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (handler.current) {
        clearTimeout(handler.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to determine if a password prompt should be shown to the user
 *
 * @description Returns true when the stored password has expired and user needs to re-enter it.
 *
 * @returns {boolean} True if password prompt should be shown, false otherwise
 */
export const useAskPassword = (): boolean => {
  const [askPassword, setAskPassword] = useState(false);

  useEffect(() => {
    isPasswordFresh().then((isFresh) => setAskPassword(!isFresh));
  }, []);

  return askPassword;
};

const emptyResponse = {
  data: {
    transaction: null,
    transactions: { edges: [], pageInfo: { hasNextPage: false } },
  },
} as GQLResultInterface;

export const useTransactions = (activeAddress: string, limit?: number) => {
  const defaultCursors = ["", "", "", "", "", ""];
  const defaultHasNextPages = [true, true, true, true, true, true];

  const [count, setCount] = useState({ current: 0, actual: 0 });
  const [cursors, setCursors] = useState(defaultCursors);
  const [hasNextPages, setHasNextPages] = useState(defaultHasNextPages);
  const [transactions, setTransactions] = useState<GroupedTransactions>({});
  const [loading, setLoading] = useState(false);

  const hasNextPage = useMemo(() => hasNextPages.some((v) => v === true), [hasNextPages]);

  const fetchTransactions = useCallback(async () => {
    try {
      if (!activeAddress || !hasNextPage) return;

      setLoading(true);

      const queries = [
        AR_RECEIVER_QUERY_WITH_CURSOR,
        AR_SENT_QUERY_WITH_CURSOR,
        AO_SENT_QUERY_WITH_CURSOR,
        AO_RECEIVER_QUERY_WITH_CURSOR,
        AO_LIQUIDOPS_RECEIVER_QUERY_WITH_CURSOR,
        PRINT_ARWEAVE_QUERY_WITH_CURSOR,
      ];

      const [rawReceived, rawSent, rawAoSent, rawAoReceived, rawLiquidOpsAoReceived, rawPrintArchive] =
        await Promise.allSettled(
          queries.map((query, idx) => {
            return hasNextPages[idx]
              ? retryWithDelay(async (attempt) => {
                  const data = await gql(
                    query,
                    { address: activeAddress, after: cursors[idx], sort: "INGESTED_AT_DESC" },
                    idx !== 5
                      ? txHistoryGateways[attempt % txHistoryGateways.length]
                      : printTxWorkingGateways[attempt % printTxWorkingGateways.length],
                  );
                  if (data?.data === null && (data as any)?.errors?.length > 0) {
                    throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
                  }
                  return data;
                }, 2)
              : Promise.resolve(emptyResponse);
          }),
        );

      let pendingTransactions = await getPendingTransactions(activeAddress);
      const aoTransactions = [
        ...(rawAoSent.status === "fulfilled" ? rawAoSent.value?.data?.transactions?.edges || [] : []),
        ...(rawAoReceived.status === "fulfilled" ? rawAoReceived.value?.data?.transactions?.edges || [] : []),
        ...(pendingTransactions as any[]),
      ];
      await checkTransferStatus(aoTransactions);

      let sent = await processTransactions(rawSent, "sent");
      let received = await processTransactions(rawReceived, "received");
      const aoSent = await processTransactions(rawAoSent, "aoSent", true);
      const aoReceived = await processTransactions(rawAoReceived, "aoReceived", true);
      const liquidOpsAoReceived = await processTransactions(rawLiquidOpsAoReceived, "liquidOpsAoReceived", true);
      const printArchive = await processTransactions(rawPrintArchive, "printArchive");

      setCursors((prev) =>
        [received, sent, aoSent, aoReceived, liquidOpsAoReceived, printArchive].map(
          (data, idx) => data[data.length - 1]?.cursor ?? prev[idx],
        ),
      );

      sent = sent.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
      received = received.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));

      setHasNextPages(
        [rawReceived, rawSent, rawAoSent, rawAoReceived, rawLiquidOpsAoReceived, rawPrintArchive].map(
          (result) =>
            (result.status === "fulfilled" && result.value?.data?.transactions?.pageInfo?.hasNextPage) ?? true,
        ),
      );

      let combinedTransactions: ExtendedTransaction[] = [
        ...sent,
        ...received,
        ...aoReceived,
        ...aoSent,
        ...liquidOpsAoReceived,
        ...printArchive,
      ];

      if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") {
        const announcementTransactions = convertAnnouncementsToTransactions();
        combinedTransactions = [...combinedTransactions, ...announcementTransactions];
      }

      const now = new Date();
      combinedTransactions = combinedTransactions.map((transaction) => {
        const timestamp = transaction.node.block?.timestamp;
        const date = timestamp ? new Date(timestamp * 1000) : now;

        return {
          ...transaction,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          date: timestamp ? date.toISOString() : null,
        };
      });

      // Get pending transactions and merge with GraphQL results
      pendingTransactions = await removeTransferErrorTransactions(pendingTransactions);
      combinedTransactions = await mergeWithPending(combinedTransactions, pendingTransactions, true);

      const actualCount = combinedTransactions.length;

      if (limit) {
        combinedTransactions = combinedTransactions.slice(0, limit);
      }

      setCount((prev) => ({
        current: prev.current + combinedTransactions.length,
        actual: prev.actual + actualCount,
      }));

      const groupedTransactions = combinedTransactions.reduce((acc, transaction) => {
        const monthYear = `${transaction.month}-${transaction.year}`;
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        if (!acc[monthYear].some((t) => t.node.id === transaction.node.id)) {
          acc[monthYear].push(transaction);
        }
        return acc;
      }, transactions);

      // Get the month-year keys and sort them in descending order
      const sortedMonthYears = Object.keys(groupedTransactions).sort((a, b) => {
        const [monthA, yearA] = a.split("-").map(Number);
        const [monthB, yearB] = b.split("-").map(Number);

        // Sort by year first, then by month
        return yearB - yearA || monthB - monthA;
      });

      // Create a new object with sorted keys
      const sortedGroupedTransactions: GroupedTransactions = sortedMonthYears.reduce((acc, key) => {
        acc[key] = groupedTransactions[key].sort(sortFn);
        return acc;
      }, {});

      setTransactions(sortedGroupedTransactions);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  }, [activeAddress, hasNextPage, transactions, limit]);

  useEffect(() => {
    setCursors(defaultCursors);
    setHasNextPages(defaultHasNextPages);
    setCount({ current: 0, actual: 0 });
    setTransactions({});
    fetchTransactions();
  }, [activeAddress]);

  return {
    transactions,
    loading,
    hasNextPage,
    count,
    fetchTransactions,
  };
};

const createFetchPromise = (query: string, cursor: string, skip: boolean, variables: Record<string, unknown>) =>
  skip
    ? Promise.resolve(emptyResponse)
    : retryWithDelay(async (attempt) => {
        const data = await gql(
          query,
          { ...variables, after: cursor, sort: "INGESTED_AT_DESC" },
          txHistoryGateways[attempt % txHistoryGateways.length],
        );
        if (data?.data === null && (data as any)?.errors?.length > 0) {
          throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
        }
        return data;
      }, 2);

export const useTokenTransactions = (activeAddress: string, tokenId: string) => {
  const { data, fetchNextPage, hasNextPage, isLoading, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["tokenTransactions", activeAddress, tokenId],
    queryFn: async ({ pageParam }) => {
      if (!activeAddress) {
        throw new Error("No active address provided");
      }

      const {
        sentCursor = "",
        receivedCursor = "",
        liquidOpsReceivedCursor = "",
        skipSent = false,
        skipReceived = false,
        skipLiquidOpsReceived = false,
      } = pageParam || {};
      const isAr = tokenId === AR_PROCESS_ID;
      const queries = isAr
        ? [AR_SENT_QUERY_WITH_CURSOR, AR_RECEIVER_QUERY_WITH_CURSOR]
        : [
            AO_SENT_QUERY_FOR_TOKEN_WITH_CURSOR,
            AO_RECEIVER_QUERY_FOR_TOKEN_WITH_CURSOR,
            AO_LIQUIDOPS_RECEIVER_QUERY_FOR_TOKEN_WITH_CURSOR,
          ];

      const fetchPromises = [
        createFetchPromise(queries[0], sentCursor, skipSent, { address: activeAddress, tokenId }),
        createFetchPromise(queries[1], receivedCursor, skipReceived, { address: activeAddress, tokenId }),
        createFetchPromise(queries[2], liquidOpsReceivedCursor, isAr ? true : skipLiquidOpsReceived, {
          address: activeAddress,
          tokenId,
        }),
      ];

      const [rawSent, rawReceived, rawLiquidOpsReceived] = await Promise.allSettled(fetchPromises);

      let pendingTransactions = await getPendingTokenTransactions(activeAddress, tokenId);
      const allTransactions = [
        ...(rawSent.status === "fulfilled" ? rawSent.value?.data?.transactions?.edges || [] : []),
        ...(rawReceived.status === "fulfilled" ? rawReceived.value?.data?.transactions?.edges || [] : []),
        ...(rawLiquidOpsReceived.status === "fulfilled"
          ? rawLiquidOpsReceived.value?.data?.transactions?.edges || []
          : []),
        ...(pendingTransactions as any[]),
      ];
      await checkTransferStatus(allTransactions);

      const sent = await processTransactions(rawSent, isAr ? "sent" : "aoSent", !isAr);
      const received = await processTransactions(rawReceived, isAr ? "received" : "aoReceived", !isAr);
      const liquidOpsReceived = await processTransactions(rawLiquidOpsReceived, "liquidOpsAoReceived", !isAr);

      let combinedTransactions: ExtendedTransaction[] = [...received, ...sent, ...liquidOpsReceived];

      const now = new Date();
      combinedTransactions = combinedTransactions.map((transaction) => {
        const timestamp = transaction.node.block?.timestamp;
        const date = timestamp ? new Date(timestamp * 1000) : now;

        return {
          ...transaction,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          date: timestamp ? date.toISOString() : null,
        };
      });

      // Get pending transactions and merge with GraphQL results
      pendingTransactions = await removeTransferErrorTransactions(pendingTransactions);
      combinedTransactions = await mergeWithPending(combinedTransactions, pendingTransactions);

      const actualCount = combinedTransactions.length;

      const nextSentCursor = sent[sent.length - 1]?.cursor || sentCursor;
      const nextReceivedCursor = received[received.length - 1]?.cursor || receivedCursor;
      const nextLiquidOpsReceivedCursor =
        liquidOpsReceived[liquidOpsReceived.length - 1]?.cursor || liquidOpsReceivedCursor;

      const hasSentNext =
        !skipSent &&
        rawSent.status === "fulfilled" &&
        rawSent.value?.data?.transactions?.pageInfo?.hasNextPage &&
        sent.length > 0 &&
        nextSentCursor !== sentCursor;

      const hasReceivedNext =
        !skipReceived &&
        rawReceived.status === "fulfilled" &&
        rawReceived.value?.data?.transactions?.pageInfo?.hasNextPage &&
        received.length > 0 &&
        nextReceivedCursor !== receivedCursor;

      const hasLiquidOpsReceivedNext =
        !skipLiquidOpsReceived &&
        rawLiquidOpsReceived.status === "fulfilled" &&
        rawLiquidOpsReceived.value?.data?.transactions?.pageInfo?.hasNextPage &&
        liquidOpsReceived.length > 0 &&
        nextLiquidOpsReceivedCursor !== liquidOpsReceivedCursor;
      const hasNext = hasSentNext || hasReceivedNext || hasLiquidOpsReceivedNext;

      return {
        transactions: combinedTransactions,
        actualCount,
        nextPageParam: hasNext
          ? {
              sentCursor: nextSentCursor,
              receivedCursor: nextReceivedCursor,
              skipSent: !hasSentNext || sent.length === 0,
              skipReceived: !hasReceivedNext || received.length === 0,
              skipLiquidOpsReceived: !hasLiquidOpsReceivedNext || liquidOpsReceived.length === 0,
              liquidOpsReceivedCursor: nextLiquidOpsReceivedCursor,
            }
          : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: {
      sentCursor: "",
      receivedCursor: "",
      liquidOpsReceivedCursor: "",
      skipSent: false,
      skipReceived: false,
      skipLiquidOpsReceived: false,
    },
    enabled: !!activeAddress && !!tokenId,
    staleTime: 300_000,
    refetchInterval: 300_000,
    gcTime: 600_000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });

  const transactions = useMemo(() => {
    if (!data?.pages) return [];

    const seenIds = new Set<string>();
    return data.pages
      .flatMap((page) => page.transactions)
      .filter((tx) => {
        if (seenIds.has(tx.node.id)) return false;
        seenIds.add(tx.node.id);
        return true;
      })
      .sort(sortFn);
  }, [data]);

  const count = useMemo(() => {
    if (!data?.pages) return { current: 0, actual: 0 };
    return {
      current: transactions.length,
      actual: data.pages.reduce((sum, page) => sum + page.actualCount, 0),
    };
  }, [data, transactions]);

  return {
    transactions,
    loading: isLoading || isFetching || isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    count,
    fetchTransactions: fetchNextPage,
  };
};
