import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getPools, processToken } from "./swap.utils";
import { defaultOptions, useAoTokens } from "~tokens/hooks";
import { useMemo, useCallback } from "react";
import type { Pool, TokenSelectorType } from "./swap.types";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";

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
    return pools.reduce((acc, pool) => {
      const key = [pool.tokenX, pool.tokenY].sort().join("-");
      if (!acc[key]) acc[key] = { botega: [], permaswap: [] };
      acc[key][pool.poolType].push(pool);
      return acc;
    }, {});
  }, [pools]);

  return { tokenPools, isLoading };
}

export function usePoolsForTokenPair(tokenX?: string, tokenY?: string) {
  const { tokenPools, isLoading } = useGroupedPoolsByTokenPair();

  const pairPools = useMemo<{
    botega: Pool[];
    permaswap: Pool[];
  }>(() => {
    if (!tokenX || !tokenY) return {};
    const key = [tokenX, tokenY].sort().join("-");
    return tokenPools[key] || {};
  }, [tokenPools, tokenX, tokenY]);

  return { pairPools, isLoading };
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
