import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getPools, getPriceImpact, processToken } from "./swap.utils";
import { defaultOptions, useAoTokens } from "~tokens/hooks";
import { useMemo, useCallback, useState, useEffect } from "react";
import type { Pool, SelectedPoolInfo, TokenSelectorType } from "./swap.types";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { botega } from "./dex/swap.botega";
import { permaswap } from "./dex/swap.permaswap";
import type { GetLiquidityResponse } from "./dex/dex.types";
import { log, LOG_GROUP } from "~utils/log/log.utils";

export function usePools() {
  return useQuery({
    queryKey: ["swap-pools"],
    queryFn: () => getPools(),
    ...defaultOptions,
  });
}

export function useGroupedPoolsByTokenPair() {
  const { data: pools = [], isLoading } = usePools();

  const tokenPools = useMemo(() => {
    return (
      pools
        // .sort((a, b) => +a.poolFee - +b.poolFee)
        .reduce((acc, pool) => {
          const key = [pool.tokenX, pool.tokenY].sort().join("-");
          if (!acc[key]) acc[key] = { botega: [], permaswap: [] };
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
}

export function usePoolForTokenPair({ tokenIn, tokenOut, slippage, amountIn }: usePoolForTokenPairProps) {
  const { tokenPools } = useGroupedPoolsByTokenPair();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState<SelectedPoolInfo | null>(null);

  const pairPools = useMemo<{
    botega: Pool[];
    permaswap: Pool[];
  }>(() => {
    if (!tokenIn || !tokenOut) return {};
    const key = [tokenIn, tokenOut].sort().join("-");
    return tokenPools[key] || {};
  }, [tokenPools, tokenIn, tokenOut]);

  useAsyncEffect(async () => {
    try {
      if (!tokenIn || !tokenOut || !slippage || !amountIn || Object.keys(pairPools).length === 0) {
        setSelectedPoolInfo(null);
        return;
      }

      setIsLoading(true);

      const botegaPool = pairPools?.botega?.[0];
      const permaswapPool = pairPools?.permaswap?.[0];

      if (!botegaPool && !permaswapPool) {
        log(LOG_GROUP.SWAP, "No botega or permaswap pool found");
        return;
      }

      console.log(pairPools);

      const params = {
        tokenIn,
        amountIn,
        slippage,
      };

      const [botegaResponse, permaswapResponse] = await Promise.allSettled([
        botega.getExpectedOutput({ poolId: botegaPool.poolId, ...params }),
        permaswap.getExpectedOutput({ poolId: permaswapPool.poolId, ...params }),
      ]);

      const botegaOutput = botegaResponse.status === "fulfilled" ? botegaResponse.value : null;
      const permaswapOutput = permaswapResponse.status === "fulfilled" ? permaswapResponse.value : null;

      console.log({ botegaOutput, permaswapOutput });

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

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, finalOutput.amountInWithoutFee);
      console.log({ finalOutput, liquidity, priceImpact });

      setSelectedPoolInfo({ pool: finalPool, quoteOutput: finalOutput, priceImpact });
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      setError("Error fetching pool for token pair");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, pairPools, slippage, amountIn]);

  return { selectedPoolInfo, isLoading, error };
}

interface usePoolQuoteProps {
  tokenIn?: string;
  tokenOut?: string;
  slippage?: number;
  amountIn?: string;
  pool: Pool;
}

export function usePoolQuote({ tokenIn, tokenOut, slippage, amountIn, pool }: usePoolQuoteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState<SelectedPoolInfo | null>(null);

  const fetchPoolQuote = useCallback(async () => {
    try {
      console.log({ tokenIn, tokenOut, slippage, amountIn, pool });
      if (!tokenIn || !tokenOut || !slippage || !amountIn || !pool) {
        setSelectedPoolInfo(null);
        return;
      }

      setIsLoading(true);

      const params = {
        tokenIn,
        amountIn,
        slippage,
      };

      const output = await (pool.poolType === "botega"
        ? botega.getExpectedOutput({ poolId: pool.poolId, ...params })
        : permaswap.getExpectedOutput({ poolId: pool.poolId, ...params }));

      if (!output) {
        log(LOG_GROUP.SWAP, "No final output found");
        setError("No final output found");
        return;
      }

      let liquidity: GetLiquidityResponse;

      if (output.type === "botega") {
        liquidity = await botega.getLiquidity({ poolId: pool.poolId, tokenIn, tokenOut });
      } else {
        liquidity = await permaswap.getLiquidity({ poolId: pool.poolId, tokenIn, tokenOut });
      }

      if (!liquidity) {
        log(LOG_GROUP.SWAP, "No liquidity found");
        setError("No liquidity found");
        return;
      }

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, output.amountInWithoutFee);

      setSelectedPoolInfo({ pool, quoteOutput: output, priceImpact });
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      setError("Error fetching pool for token pair");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, slippage, amountIn, pool]);

  useEffect(() => {
    if (!tokenIn || !tokenOut || !slippage || !amountIn || !pool) return;

    fetchPoolQuote();

    const interval = setInterval(fetchPoolQuote, 10000);

    return () => clearInterval(interval);
  }, [fetchPoolQuote, tokenIn, tokenOut, slippage, amountIn, pool]);

  return { selectedPoolInfo, isLoading, error };
}

export function useTokens() {
  const { data: pools = [], isLoading } = usePools();

  const tokens = useMemo(() => {
    const uniqueTokens = new Map();

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
