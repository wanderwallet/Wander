import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getExpectedOutputFn, getPools, getPriceImpact, getSwapTransaction, processToken, toFixed } from "./swap.utils";
import { defaultOptions, useAoTokens } from "~tokens/hooks";
import { useMemo, useCallback, useState, useEffect } from "react";
import type {
  ParsedSwapTransaction,
  PoolType,
  SelectedPoolInfo,
  SwapData,
  TokenInfoWithPoolPartners,
  TokenPools,
  TokenSelectorType,
} from "./swap.types";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage, TempTransactionStorage } from "~utils/storage";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { botega } from "./dex/dex.botega";
import { permaswap } from "./dex/dex.permaswap";
import type { GetLiquidityResponse } from "./dex/dex.types";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  AR_PROCESS_ID,
  AR_TOKEN_INFO,
  USDA_TOKEN_INFO,
  VAR_TOKEN_INFO,
  WAR_PROCESS_ID,
  WAR_TOKEN_INFO,
  WNDR_TOKEN_INFO,
} from "~tokens/aoTokens/ao.constants";
import { aox } from "./bridge/bridge.aox";
import { retryWithGateways } from "~gateways/wayfinder";
import { useAoxBridgeInfo, useVentoBridgeInfo } from "./bridge/bridge.hooks";
import { PoolTypeEnum, RESERVE_TIER_ID, SWAP_DISABLED_FOR_LOWER_TIERS } from "./swap.constants";
import {
  AOX_BRIDGE_TOKEN_IDS,
  getAoxBridgeTransactions,
  getVentoBridgeTransactions,
  isAoxBridgeTokenPair,
  isVentoBridgeTokenPair,
  validateAoxBridgeTransaction,
  validateVentoBridgeTransaction,
  VENTO_BRIDGE_TOKEN_IDS,
} from "./bridge/bridge.utils";
import { getBotegaTransactions, getPermaswapTransactions } from "./dex/dex.utils";
import { useActiveAddress } from "~wallets/hooks";
import BigNumber from "bignumber.js";
import { vento, VENTO_BRIDGE_ADDRESS } from "./bridge/bridge.vento";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import type { DefiFeeDetails } from "~utils/tier/types";
import browser from "webextension-polyfill";
import { useActiveTier } from "~utils/tier/hooks";
import { tierNameToId, TierTypes } from "~utils/tier/constants";

export function usePools() {
  return useQuery({
    queryKey: ["swap-pools"],
    queryFn: () => getPools(),
    ...defaultOptions,
  });
}

export function useGroupedPoolsByTokenPair() {
  const { data: pools = [], isLoading } = usePools();

  const tokenPools = useMemo<Record<string, TokenPools>>(() => {
    return (
      pools
        // .sort((a, b) => +a.poolFee - +b.poolFee)
        .reduce((acc, pool) => {
          const key = [pool.tokenX, pool.tokenY].sort().join("-");
          if (!acc[key]) acc[key] = { botega: [], permaswap: [], aox: [], vento: [] };
          acc[key][pool.poolType].push(pool);
          return acc;
        }, {})
    );
  }, [pools]);

  return { tokenPools, isLoading };
}

interface usePoolForTokenPairProps {
  tokenIn?: string;
  tokenOut?: string;
  slippage?: number;
  amountIn?: string;
  wanderFeePercent?: number;
}

export function usePoolForTokenPair({
  tokenIn,
  tokenOut,
  slippage,
  amountIn,
  wanderFeePercent,
}: usePoolForTokenPairProps) {
  const { tokenPools, isLoading: isLoadingPools } = useGroupedPoolsByTokenPair();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState<SelectedPoolInfo | null>(null);
  const { data: aoxBridgeInfo } = useAoxBridgeInfo({ enabled: isAoxBridgeTokenPair(tokenIn, tokenOut) });
  const { data: ventoBridgeInfo } = useVentoBridgeInfo({ enabled: isVentoBridgeTokenPair(tokenIn, tokenOut) });

  const pairPools = useMemo(() => {
    if (!tokenIn || !tokenOut) return { botega: [], permaswap: [], aox: [], vento: [] };
    const key = [tokenIn, tokenOut].sort().join("-");
    return tokenPools[key] || { botega: [], permaswap: [], aox: [], vento: [] };
  }, [tokenPools, tokenIn, tokenOut]);

  useAsyncEffect(async () => {
    try {
      if (isLoadingPools) return;

      const noPools = Object.values(pairPools).every((pools) => pools.length === 0);
      if (!tokenIn || !tokenOut || !slippage || !amountIn || isNaN(wanderFeePercent) || noPools) {
        setSelectedPoolInfo(null);
        setError(
          amountIn && tokenIn && tokenOut && noPools ? browser.i18n.getMessage("no_liquidity_pools_found") : null,
        );
        return;
      }

      setIsLoading(true);

      const wanderFee = BigNumber(amountIn)
        .multipliedBy(wanderFeePercent)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_DOWN);

      if (isAoxBridgeTokenPair(tokenIn, tokenOut)) {
        const validationError = validateAoxBridgeTransaction(amountIn, wanderFee, aoxBridgeInfo, tokenIn, tokenOut);
        if (validationError) {
          setError(validationError);
          return;
        }

        const aoxPool = pairPools?.aox?.[0];
        const aoxOutput = await aox.getExpectedOutput({
          poolId: aoxPool.poolId,
          tokenIn,
          amountIn,
          wanderFee,
        });

        setSelectedPoolInfo({
          poolId: aoxPool.poolId,
          poolType: aoxPool.poolType,
          quoteOutput: aoxOutput,
          priceImpact: "0.00",
        });

        setError(null);

        return;
      }

      if (isVentoBridgeTokenPair(tokenIn, tokenOut)) {
        const validationError = validateVentoBridgeTransaction(amountIn, wanderFee, ventoBridgeInfo, tokenIn, tokenOut);
        if (validationError) {
          setError(validationError);
          return;
        }

        const ventoPool = pairPools?.vento?.[0];
        const ventoOutput = await vento.getExpectedOutput({
          poolId: ventoPool.poolId,
          tokenIn,
          amountIn,
          wanderFee,
        });

        setSelectedPoolInfo({
          poolId: ventoPool.poolId,
          poolType: ventoPool.poolType,
          quoteOutput: ventoOutput,
          priceImpact: "0.00",
        });

        setError(null);

        return;
      }

      const botegaPool = pairPools?.botega?.[0];
      const permaswapPool = pairPools?.permaswap?.[0];

      if (!botegaPool && !permaswapPool) {
        log(LOG_GROUP.SWAP, "No botega or permaswap pool found");
        setError(browser.i18n.getMessage("no_liquidity_pools_found"));
        return;
      }

      const params = {
        tokenIn,
        amountIn,
        slippage,
        wanderFee,
      };

      const [botegaResponse, permaswapResponse] = await Promise.allSettled([
        botega.getExpectedOutput({ poolId: botegaPool.poolId, ...params }),
        permaswap.getExpectedOutput({ poolId: permaswapPool.poolId, ...params }),
      ]);

      const botegaOutput = botegaResponse.status === "fulfilled" ? botegaResponse.value : null;
      const permaswapOutput = permaswapResponse.status === "fulfilled" ? permaswapResponse.value : null;

      const finalOutput =
        botegaOutput && permaswapOutput
          ? botegaOutput.amountOut > permaswapOutput.amountOut
            ? botegaOutput
            : permaswapOutput
          : botegaOutput || permaswapOutput;

      const finalPool = botegaPool?.poolId === finalOutput.poolId ? botegaPool : permaswapPool;

      if (!finalOutput) {
        log(LOG_GROUP.SWAP, "No final output found");
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        return;
      }

      let liquidity: GetLiquidityResponse;

      if (finalOutput.type === "botega") {
        liquidity = await botega.getLiquidity({ poolId: botegaPool.poolId, tokenIn, tokenOut });
      } else {
        liquidity = await permaswap.getLiquidity({ poolId: permaswapPool.poolId, tokenIn, tokenOut });
      }

      if (!liquidity) {
        log(LOG_GROUP.SWAP, "No liquidity found");
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        return;
      }

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, finalOutput.poolAmountIn);

      setSelectedPoolInfo({
        poolId: finalPool.poolId,
        poolType: finalPool.poolType,
        quoteOutput: finalOutput,
        priceImpact,
      });
      setError(null);
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenIn,
    tokenOut,
    pairPools,
    slippage,
    amountIn,
    aoxBridgeInfo,
    ventoBridgeInfo,
    wanderFeePercent,
    isLoadingPools,
  ]);

  return { selectedPoolInfo, isLoading: isLoadingPools || isLoading, error };
}

interface usePoolQuoteProps {
  tokenIn?: string;
  tokenOut?: string;
  slippage?: number;
  amountIn?: string;
  poolId?: string;
  poolType?: PoolType;
  stopFetching?: boolean;
  wanderFeePercent?: number;
}

export function usePoolQuote({
  tokenIn,
  tokenOut,
  slippage,
  amountIn,
  poolId,
  poolType,
  stopFetching,
  wanderFeePercent,
}: usePoolQuoteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState<SelectedPoolInfo | null>(null);

  const fetchPoolQuote = useCallback(async () => {
    try {
      if (
        !tokenIn ||
        !tokenOut ||
        !slippage ||
        !amountIn ||
        !poolId ||
        !poolType ||
        isNaN(wanderFeePercent) ||
        stopFetching
      ) {
        setSelectedPoolInfo(null);
        setError(null);
        return;
      }

      setIsLoading(true);

      const wanderFee = BigNumber(amountIn)
        .multipliedBy(wanderFeePercent)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_DOWN);

      const params = {
        tokenIn,
        amountIn,
        slippage,
        wanderFee,
      };

      const output = await getExpectedOutputFn(poolType, { poolId, ...params });

      if (!output) {
        log(LOG_GROUP.SWAP, "No final output found");
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        return;
      }

      let liquidity: GetLiquidityResponse;

      if (output.type === PoolTypeEnum.BOTEGA) {
        liquidity = await botega.getLiquidity({ poolId, tokenIn, tokenOut });
      } else {
        liquidity = await permaswap.getLiquidity({ poolId, tokenIn, tokenOut });
      }

      if (!liquidity) {
        log(LOG_GROUP.SWAP, "No liquidity found");
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        return;
      }

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, output.poolAmountIn);

      setSelectedPoolInfo({
        poolId,
        poolType,
        quoteOutput: output,
        priceImpact,
      });
      setError(null);
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, slippage, amountIn, poolId, poolType, wanderFeePercent]);

  useEffect(() => {
    if (
      !tokenIn ||
      !tokenOut ||
      !slippage ||
      !amountIn ||
      !poolId ||
      !poolType ||
      stopFetching ||
      (AOX_BRIDGE_TOKEN_IDS.has(tokenIn) && AOX_BRIDGE_TOKEN_IDS.has(tokenOut)) ||
      (VENTO_BRIDGE_TOKEN_IDS.has(tokenIn) && VENTO_BRIDGE_TOKEN_IDS.has(tokenOut))
    ) {
      return;
    }

    // fetchPoolQuote();

    const interval = setInterval(fetchPoolQuote, 10000);

    return () => clearInterval(interval);
  }, [fetchPoolQuote, tokenIn, tokenOut, slippage, amountIn, poolId, poolType, stopFetching]);

  return { selectedPoolInfo, isLoading, error };
}

export function useTokens() {
  const { data: pools = [], isLoading } = usePools();

  const tokens = useMemo<TokenInfoWithPoolPartners[]>(() => {
    if (pools.length === 0) return [];

    const uniqueTokens = new Map();
    const tokenPoolPartners = new Map<string, Set<string>>();

    processToken(uniqueTokens, AR_TOKEN_INFO);
    processToken(uniqueTokens, WAR_TOKEN_INFO);
    processToken(uniqueTokens, VAR_TOKEN_INFO);

    for (const pool of pools) {
      // Process token X
      processToken(uniqueTokens, {
        Name: pool.tokenXName,
        Ticker: pool.tokenXTicker,
        Denomination: pool.tokenXDenomination,
        Logo: pool.tokenXLogo,
        processId: pool.tokenX,
      });

      // Process token Y
      processToken(uniqueTokens, {
        Name: pool.tokenYName,
        Ticker: pool.tokenYTicker,
        Denomination: pool.tokenYDenomination,
        Logo: pool.tokenYLogo,
        processId: pool.tokenY,
      });

      if (!tokenPoolPartners.has(pool.tokenX)) {
        tokenPoolPartners.set(pool.tokenX, new Set());
      }
      if (!tokenPoolPartners.has(pool.tokenY)) {
        tokenPoolPartners.set(pool.tokenY, new Set());
      }

      tokenPoolPartners.get(pool.tokenX).add(pool.tokenY);
      tokenPoolPartners.get(pool.tokenY).add(pool.tokenX);
    }

    return Array.from(uniqueTokens.values()).map((token) => ({
      ...token,
      poolPartners: tokenPoolPartners.get(token.processId) || new Set(),
    }));
  }, [pools]);

  return { tokens, isLoading };
}

export function useTokensWithPagination(
  pageSize: number = 20,
  searchTerm: string = "",
  tokenSelectorType: TokenSelectorType,
  filterTokenId?: string,
) {
  const { tokens: poolTokens, isLoading: isPoolsLoading } = useTokens();
  const { tokens: userTokens } = useAoTokens({ type: "asset", hidden: false });

  const allTokens = useMemo(() => {
    if (tokenSelectorType === "send") {
      const poolTokenIds = new Set(poolTokens.map((token) => token.processId));
      return userTokens.filter((token) => poolTokenIds.has(token.id) && token.id !== filterTokenId);
    }
    const tokenToFilter = poolTokens.find((token) => token.processId === filterTokenId);
    return poolTokens.filter(
      (token) => token.processId !== filterTokenId && token.poolPartners.has(tokenToFilter.processId),
    );
  }, [userTokens, poolTokens, tokenSelectorType, filterTokenId]);

  const filteredTokens = useMemo(() => {
    if (!searchTerm.trim()) return allTokens;

    const searchLower = searchTerm.toLowerCase();
    return allTokens.filter((token) => {
      const name = token.Name?.toLowerCase() || "";
      const symbol = token.Ticker?.toLowerCase() || "";
      return name.includes(searchLower) || symbol.includes(searchLower);
    });
  }, [allTokens, searchTerm, tokenSelectorType, filterTokenId]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["tokens-with-pagination", filteredTokens.length, pageSize, searchTerm, tokenSelectorType],
    queryFn: ({ pageParam = 0 }) => {
      const startIndex = pageParam * pageSize;
      const endIndex = startIndex + pageSize;
      return {
        tokens: filteredTokens.slice(startIndex, endIndex),
        nextPage: endIndex < filteredTokens.length ? pageParam + 1 : undefined,
        hasMore: endIndex < filteredTokens.length,
        totalCount: filteredTokens.length,
        currentPage: pageParam,
        startIndex,
        endIndex,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: filteredTokens.length > 0,
    staleTime: searchTerm ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 min for search, 5 min for pagination
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const tokens = useMemo(() => {
    return infiniteQuery.data?.pages.flatMap((page) => page.tokens) || [];
  }, [infiniteQuery.data]);

  const fetchNextPageOptimized = useCallback(async () => {
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      try {
        await infiniteQuery.fetchNextPage();
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    }
  }, [infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage]);

  return {
    tokens,
    allTokens: filteredTokens, // Return filtered tokens as allTokens for consistency
    isLoading: isPoolsLoading || infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: fetchNextPageOptimized,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    totalCount: filteredTokens.length,
    loadedCount: tokens.length,
    // Additional TanStack Query features
    refetch: infiniteQuery.refetch,
    isRefetching: infiniteQuery.isRefetching,
    isStale: infiniteQuery.isStale,
  };
}

export function useSwapSlippage() {
  return useStorage({ key: "swap_selected_slippage", instance: ExtensionStorage }, 0.5);
}

export function useARNetworkFee({ tokenIn, tokenOut }: { tokenIn: string; tokenOut: string }) {
  const [networkFee, setNetworkFee] = useState<string>("0");
  const isAoxBridge = useMemo(() => tokenIn === AR_PROCESS_ID && tokenOut === WAR_PROCESS_ID, [tokenIn, tokenOut]);
  const { data: aoxBridgeInfo, isLoading: isBridgeInfoLoading } = useAoxBridgeInfo({
    enabled: isAoxBridge,
  });
  const [isLoading, setIsLoading] = useState(false);

  useAsyncEffect(async () => {
    if (
      !tokenIn ||
      !tokenOut ||
      tokenIn !== AR_PROCESS_ID ||
      (isAoxBridge && (!aoxBridgeInfo || isBridgeInfoLoading))
    ) {
      setNetworkFee("0");
      return;
    }

    setIsLoading(true);

    try {
      const { result: txPrice } = await retryWithGateways((arweave) =>
        arweave.transactions.getPrice(0, isAoxBridge ? aoxBridgeInfo.arToken.locker : VENTO_BRIDGE_ADDRESS),
      );

      // twice the network fee to account for the wander fee to be paid
      setNetworkFee(BigNumber(txPrice).multipliedBy(2).toFixed());
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error calculating network fee:", error);
      setNetworkFee("0");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, aoxBridgeInfo, isAoxBridge]);

  return { networkFee, isLoading };
}

export function useSavedSwapData() {
  return useStorage<SwapData>({ key: "swap-data", instance: TempTransactionStorage });
}

export function useSwapSendToken() {
  return useStorage<TokenInfo>({ key: "swap_send_token", instance: ExtensionStorage }, USDA_TOKEN_INFO);
}

export function useSwapReceiveToken() {
  return useStorage<TokenInfo>({ key: "swap_receive_token", instance: ExtensionStorage }, WNDR_TOKEN_INFO);
}

const EMPTY_RESPONSE = {
  txs: [],
  hasNextPage: false,
  cursor: "",
} as const;

const SWAP_SOURCES = [
  { name: "botega", queryFn: getBotegaTransactions, defaultCursor: "" },
  { name: "permaswap", queryFn: getPermaswapTransactions, defaultCursor: "" },
  { name: "aox", queryFn: getAoxBridgeTransactions, defaultCursor: "0" },
  { name: "vento", queryFn: getVentoBridgeTransactions, defaultCursor: "" },
] as const;

interface PageParam {
  botegaCursor: string;
  permaswapCursor: string;
  aoxCursor: string;
  ventoCursor: string;
  skipBotega: boolean;
  skipPermaswap: boolean;
  skipAox: boolean;
  skipVento: boolean;
}

interface TransactionPage {
  transactions: ParsedSwapTransaction[];
  actualCount: number;
  nextPageParam?: PageParam;
}

const sortTransactionsByTimestamp = (a: ParsedSwapTransaction, b: ParsedSwapTransaction) => {
  const timestampA = a.timestamp || Number.MAX_SAFE_INTEGER;
  const timestampB = b.timestamp || Number.MAX_SAFE_INTEGER;
  return timestampB - timestampA;
};

const hasChangedCursor = (newCursor: string, oldCursor: string) => newCursor !== oldCursor;

const hasNextPageData = (data: any, newCursor: string, oldCursor: string) =>
  data.hasNextPage && hasChangedCursor(newCursor, oldCursor);

export const useSwapTransactions = () => {
  const activeAddress = useActiveAddress();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetching, isFetchingNextPage } =
    useInfiniteQuery<TransactionPage>({
      queryKey: ["swapTransactions", activeAddress],
      queryFn: async ({ pageParam }): Promise<TransactionPage> => {
        if (!activeAddress) {
          throw new Error("No active address provided");
        }

        const {
          botegaCursor = "",
          permaswapCursor = "",
          aoxCursor = "0",
          ventoCursor = "",
          skipBotega = false,
          skipPermaswap = false,
          skipAox = false,
          skipVento = false,
        } = (pageParam as PageParam) || {};

        // Execute all queries in parallel
        const cursors = [botegaCursor, permaswapCursor, aoxCursor, ventoCursor];
        const skipFlags = [skipBotega, skipPermaswap, skipAox, skipVento];

        const results = await Promise.allSettled(
          SWAP_SOURCES.map((source, idx) =>
            !skipFlags[idx] ? source.queryFn(activeAddress, cursors[idx]) : Promise.resolve(EMPTY_RESPONSE),
          ),
        );

        // Process results and extract data
        const dataResults = results.map((result) => (result.status === "fulfilled" ? result.value : EMPTY_RESPONSE));

        const [botegaData, permaswapData, aoxData, ventoData] = dataResults;

        // Combine and sort transactions
        const combinedTransactions = [...botegaData.txs, ...permaswapData.txs, ...aoxData.txs, ...ventoData.txs].sort(
          sortTransactionsByTimestamp,
        );

        // Calculate new cursors and pagination state
        const newCursors = [
          hasChangedCursor(botegaData.cursor, botegaCursor) ? botegaData.cursor : botegaCursor,
          hasChangedCursor(permaswapData.cursor, permaswapCursor) ? permaswapData.cursor : permaswapCursor,
          hasChangedCursor(aoxData.cursor, aoxCursor) ? aoxData.cursor : aoxCursor,
          hasChangedCursor(ventoData.cursor, ventoCursor) ? ventoData.cursor : ventoCursor,
        ];

        const hasNextPageFlags = [
          hasNextPageData(botegaData, newCursors[0], botegaCursor),
          hasNextPageData(permaswapData, newCursors[1], permaswapCursor),
          hasNextPageData(aoxData, newCursors[2], aoxCursor),
          hasNextPageData(ventoData, newCursors[3], ventoCursor),
        ];

        const hasNext = hasNextPageFlags.some(Boolean);

        return {
          transactions: combinedTransactions,
          actualCount: combinedTransactions.length,
          nextPageParam: hasNext
            ? {
                botegaCursor: newCursors[0],
                permaswapCursor: newCursors[1],
                aoxCursor: newCursors[2],
                ventoCursor: newCursors[3],
                skipBotega: !hasNextPageFlags[0] || botegaData.txs.length === 0,
                skipPermaswap: !hasNextPageFlags[1] || permaswapData.txs.length === 0,
                skipAox: !hasNextPageFlags[2] || aoxData.txs.length === 0,
                skipVento: !hasNextPageFlags[3] || ventoData.txs.length === 0,
              }
            : undefined,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextPageParam,
      initialPageParam: {
        botegaCursor: "",
        permaswapCursor: "",
        aoxCursor: "0",
        ventoCursor: "",
        skipBotega: false,
        skipPermaswap: false,
        skipAox: false,
        skipVento: false,
      } as PageParam,
      enabled: !!activeAddress,
      ...defaultOptions,
    });

  const transactions = useMemo(() => {
    if (!data?.pages) return [];

    const seenIds = new Set<string>();
    return data.pages
      .flatMap((page) => page.transactions)
      .filter((tx) => {
        if (seenIds.has(tx.txId)) return false;
        seenIds.add(tx.txId);
        return true;
      })
      .sort(sortTransactionsByTimestamp);
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

export function useSwapTransaction(txId: string) {
  const {
    data: transaction,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["swapTransaction", txId],
    queryFn: () => getSwapTransaction(txId),
    enabled: !!txId,
    ...defaultOptions,
    retry: 10,
    retryDelay: 1000,
  });

  return {
    transaction: transaction || null,
    loading,
    error,
  };
}

export function useWanderFee({
  valueIn,
  defiFeeDetails,
  token,
}: {
  valueIn: string;
  defiFeeDetails: DefiFeeDetails;
  token: TokenInfo;
}) {
  return useMemo(() => {
    if (!valueIn || !defiFeeDetails || !token) {
      return { originalFee: "--", finalFee: "--", hasChanged: false };
    }

    const originalFee = BigNumber(valueIn).multipliedBy(defiFeeDetails.originalFeePercent).dividedBy(100).toFixed();
    const finalFee = BigNumber(valueIn).multipliedBy(defiFeeDetails.finalFeePercent).dividedBy(100).toFixed();

    return {
      hasChanged: defiFeeDetails.feeHasChanged,
      originalFee,
      finalFee,
    };
  }, [valueIn, defiFeeDetails, token]);
}

export function useProviderNetworkFee({
  selectedPoolInfo,
  sendToken,
  receiveToken,
  networkFee,
}: {
  selectedPoolInfo: SelectedPoolInfo;
  sendToken: TokenInfo;
  receiveToken: TokenInfo;
  networkFee: string;
}) {
  return useMemo(() => {
    if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken) return "--";

    let tokenInFee = BigNumber(selectedPoolInfo.quoteOutput.tokenInFee || "0");
    let tokenOutFee = BigNumber(selectedPoolInfo.quoteOutput.tokenOutFee || "0");

    if (selectedPoolInfo.poolType === "aox" || selectedPoolInfo.poolType === "vento") {
      if (sendToken.processId === AR_PROCESS_ID) {
        tokenInFee = tokenInFee.plus(networkFee);
      } else {
        tokenOutFee = tokenOutFee.plus(networkFee);
      }
    }

    const formatFee = (amount: BigNumber, token: TokenInfo) =>
      `${toFixed(amount.shiftedBy(-token.Denomination), 8)} ${token.Ticker}`;

    if (tokenInFee.isZero() && tokenOutFee.isZero()) {
      return `0 ${sendToken.Ticker}`;
    }

    const fees = [];
    if (!tokenInFee.isZero()) {
      fees.push(formatFee(tokenInFee, sendToken));
    }

    if (!tokenOutFee.isZero()) {
      fees.push(formatFee(tokenOutFee, receiveToken));
    }

    return fees.join(" + ");
  }, [selectedPoolInfo, sendToken, receiveToken, networkFee]);
}

export function useSwapRate({
  selectedPoolInfo,
  sendToken,
  receiveToken,
  amountIn,
}: {
  selectedPoolInfo: SelectedPoolInfo;
  sendToken: TokenInfo;
  receiveToken: TokenInfo;
  amountIn: string;
}) {
  return useMemo(() => {
    if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken || !amountIn) return "--";

    const valueIn = BigNumber(amountIn).shiftedBy(-sendToken.Denomination);
    const valueOut = BigNumber(selectedPoolInfo.quoteOutput.amountOut || "0").shiftedBy(-receiveToken.Denomination);

    const valueOutForUnitValueIn = valueOut.dividedBy(valueIn);
    return `1 ${sendToken.Ticker} ≈ ${toFixed(valueOutForUnitValueIn, 8)} ${receiveToken.Ticker}`;
  }, [selectedPoolInfo, sendToken, receiveToken, amountIn]);
}

export function useIsSwapGated() {
  const { data: activeTier } = useActiveTier();

  return useMemo(() => {
    const tierId = tierNameToId[activeTier?.tier || TierTypes.Core];
    return tierId > RESERVE_TIER_ID && SWAP_DISABLED_FOR_LOWER_TIERS;
  }, [activeTier?.tier]);
}
