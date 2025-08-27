import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  AOX_BRIDGE_TOKEN_IDS,
  getExpectedOutputFn,
  getPools,
  getPriceImpact,
  getSwapTransaction,
  processToken,
  VENTO_BRIDGE_TOKEN_IDS,
} from "./swap.utils";
import { defaultOptions, useAoTokens } from "~tokens/hooks";
import { useMemo, useCallback, useState, useEffect } from "react";
import type {
  ParsedSwapTransaction,
  Pool,
  SelectedPoolInfo,
  SwapData,
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
  VAR_PROCESS_ID,
  VAR_TOKEN_INFO,
  WAR_PROCESS_ID,
  WAR_TOKEN_INFO,
} from "~tokens/aoTokens/ao.constants";
import { aox } from "./bridge/bridge.aox";
import { retryWithGateways } from "~gateways/wayfinder";
import { useAoxBridgeInfo, useVentoBridgeInfo } from "./bridge/bridge.hooks";
import { PoolTypeEnum } from "./swap.constants";
import {
  getAoxBridgeTransactions,
  validateAoxBridgeTransaction,
  validateVentoBridgeTransaction,
} from "./bridge/bridge.utils";
import { getBotegaTransactions, getPermaswapTransactions } from "./dex/dex.utils";
import { useActiveAddress } from "~wallets/hooks";
import BigNumber from "bignumber.js";
import { vento, VENTO_BRIDGE_ADDRESS } from "./bridge/bridge.vento";

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
  const { tokenPools } = useGroupedPoolsByTokenPair();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState<SelectedPoolInfo | null>(null);
  const { data: aoxBridgeInfo } = useAoxBridgeInfo({
    enabled: tokenIn === AR_PROCESS_ID && tokenOut === WAR_PROCESS_ID,
  });
  const { data: ventoBridgeInfo } = useVentoBridgeInfo({
    enabled: tokenIn === AR_PROCESS_ID && tokenOut === VAR_PROCESS_ID,
  });

  const pairPools = useMemo(() => {
    if (!tokenIn || !tokenOut) return { botega: [], permaswap: [], aox: [], vento: [] };
    const key = [tokenIn, tokenOut].sort().join("-");
    return tokenPools[key] || { botega: [], permaswap: [], aox: [], vento: [] };
  }, [tokenPools, tokenIn, tokenOut]);

  useAsyncEffect(async () => {
    try {
      const noPools = Object.values(pairPools).every((pools) => pools.length === 0);
      if (!tokenIn || !tokenOut || !slippage || !amountIn || isNaN(wanderFeePercent) || noPools) {
        setSelectedPoolInfo(null);
        setError(amountIn && tokenIn && tokenOut && noPools ? "No liquidity pools found for this token pair" : null);
        return;
      }

      setIsLoading(true);

      const wanderFee = BigNumber(amountIn)
        .multipliedBy(wanderFeePercent)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_FLOOR);

      if (AOX_BRIDGE_TOKEN_IDS.has(tokenIn) && AOX_BRIDGE_TOKEN_IDS.has(tokenOut)) {
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
          pool: pairPools?.aox?.[0],
          quoteOutput: aoxOutput,
          priceImpact: "0.00",
        });

        setError(null);

        return;
      }

      if (VENTO_BRIDGE_TOKEN_IDS.has(tokenIn) && VENTO_BRIDGE_TOKEN_IDS.has(tokenOut)) {
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
          pool: pairPools?.vento?.[0],
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
        setError("No botega or permaswap pool found");
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
        setError("No final output found");
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
        setError("No liquidity found");
        return;
      }

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, finalOutput.poolAmountIn);

      setSelectedPoolInfo({ pool: finalPool, quoteOutput: finalOutput, priceImpact });
      setError(null);
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      setError("Error fetching pool for token pair");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, pairPools, slippage, amountIn, aoxBridgeInfo, ventoBridgeInfo, wanderFeePercent]);

  return { selectedPoolInfo, isLoading, error };
}

interface usePoolQuoteProps {
  tokenIn?: string;
  tokenOut?: string;
  slippage?: number;
  amountIn?: string;
  pool: Pool;
  stopFetching?: boolean;
  wanderFeePercent?: number;
}

export function usePoolQuote({
  tokenIn,
  tokenOut,
  slippage,
  amountIn,
  pool,
  stopFetching,
  wanderFeePercent,
}: usePoolQuoteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState<SelectedPoolInfo | null>(null);

  const fetchPoolQuote = useCallback(async () => {
    try {
      if (!tokenIn || !tokenOut || !slippage || !amountIn || !pool || isNaN(wanderFeePercent) || stopFetching) {
        setSelectedPoolInfo(null);
        setError(null);
        return;
      }

      setIsLoading(true);

      const wanderFee = BigNumber(amountIn)
        .multipliedBy(wanderFeePercent)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_FLOOR);

      const params = {
        tokenIn,
        amountIn,
        slippage,
        wanderFee,
      };

      const output = await getExpectedOutputFn(pool.poolType, { poolId: pool.poolId, ...params });

      if (!output) {
        log(LOG_GROUP.SWAP, "No final output found");
        setError("No final output found");
        return;
      }

      let liquidity: GetLiquidityResponse;

      if (output.type === PoolTypeEnum.BOTEGA) {
        liquidity = await botega.getLiquidity({ poolId: pool.poolId, tokenIn, tokenOut });
      } else {
        liquidity = await permaswap.getLiquidity({ poolId: pool.poolId, tokenIn, tokenOut });
      }

      if (!liquidity) {
        log(LOG_GROUP.SWAP, "No liquidity found");
        setError("No liquidity found");
        return;
      }

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, output.poolAmountIn);

      setSelectedPoolInfo({ pool, quoteOutput: output, priceImpact });
      setError(null);
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      setError("Error fetching pool for token pair");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, slippage, amountIn, pool, wanderFeePercent]);

  useEffect(() => {
    if (
      !tokenIn ||
      !tokenOut ||
      !slippage ||
      !amountIn ||
      !pool ||
      stopFetching ||
      (AOX_BRIDGE_TOKEN_IDS.has(tokenIn) && AOX_BRIDGE_TOKEN_IDS.has(tokenOut)) ||
      (VENTO_BRIDGE_TOKEN_IDS.has(tokenIn) && VENTO_BRIDGE_TOKEN_IDS.has(tokenOut))
    ) {
      return;
    }

    // fetchPoolQuote();

    const interval = setInterval(fetchPoolQuote, 10000);

    return () => clearInterval(interval);
  }, [fetchPoolQuote, tokenIn, tokenOut, slippage, amountIn, pool, stopFetching]);

  return { selectedPoolInfo, isLoading, error };
}

export function useTokens() {
  const { data: pools = [], isLoading } = usePools();

  const tokens = useMemo(() => {
    if (pools.length === 0) return [];

    const uniqueTokens = new Map();

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
    }

    return Array.from(uniqueTokens.values());
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
    return poolTokens.filter((token) => token.processId !== filterTokenId);
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
      console.error("Error calculating network fee:", error);
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

const emptyResponse = {
  txs: [],
  hasNextPage: false,
  cursor: "",
};

const defaultCursors = ["", "", "0"];
const defaultHasNextPages = [true, true, true];

export const useSwapTransactions = () => {
  const activeAddress = useActiveAddress();
  const [cursors, setCursors] = useState(defaultCursors);
  const [hasNextPages, setHasNextPages] = useState(defaultHasNextPages);
  const [transactions, setTransactions] = useState<ParsedSwapTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const hasNextPage = useMemo(() => hasNextPages.some((v) => v === true), [hasNextPages]);

  const fetchTransactions = useCallback(async () => {
    try {
      if (!activeAddress || !hasNextPage) return;

      setLoading(true);

      const queriesFn = [getBotegaTransactions, getPermaswapTransactions, getAoxBridgeTransactions];

      const [botegaResult, permaswapResult, aoxResult] = await Promise.allSettled(
        queriesFn.map((queryFn, idx) => {
          return hasNextPages[idx] ? queryFn(activeAddress, cursors[idx]) : Promise.resolve(emptyResponse);
        }),
      );

      const botegaData = botegaResult.status === "fulfilled" ? botegaResult.value : emptyResponse;
      const permaswapData = permaswapResult.status === "fulfilled" ? permaswapResult.value : emptyResponse;
      const aoxData = aoxResult.status === "fulfilled" ? aoxResult.value : emptyResponse;

      setCursors([botegaData.cursor, permaswapData.cursor, aoxData.cursor]);
      setHasNextPages([botegaData.hasNextPage, permaswapData.hasNextPage, aoxData.hasNextPage]);

      let combinedTransactions: ParsedSwapTransaction[] = [...botegaData.txs, ...permaswapData.txs, ...aoxData.txs];

      combinedTransactions.sort((a: ParsedSwapTransaction, b: ParsedSwapTransaction) => {
        const timestampA = a.timestamp || Number.MAX_SAFE_INTEGER;
        const timestampB = b.timestamp || Number.MAX_SAFE_INTEGER;
        return timestampB - timestampA;
      });

      setTransactions((prev) => [...prev, ...combinedTransactions]);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  }, [activeAddress, hasNextPage, cursors, hasNextPages]);

  useEffect(() => {
    setCursors(defaultCursors);
    setHasNextPages(defaultHasNextPages);
    setTransactions([]);
    fetchTransactions();
  }, [activeAddress]);

  return {
    transactions,
    loading,
    hasNextPage,
    fetchTransactions,
  };
};

export function useSwapTransaction(txId: string) {
  const [transaction, setTransaction] = useState<ParsedSwapTransaction | null>(null);
  const [loading, setLoading] = useState(false);

  useAsyncEffect(async () => {
    if (!txId) return;

    setLoading(true);
    try {
      const transaction = await getSwapTransaction(txId);
      setTransaction(transaction);
    } catch (error) {
      console.error("Error fetching transaction", error);
    } finally {
      setLoading(false);
    }
  }, [txId]);

  return { transaction, loading };
}
