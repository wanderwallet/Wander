import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getExpectedOutputFn,
  getPools,
  getPriceImpact,
  getSwapTransaction,
  processToken,
  toFixed,
  convertSwapsArrayToParsedTransactions,
  calculateNetworkProviderFee,
  calculateRate,
  sortTransactionsByTimestamp,
} from "./swap.utils";
import { defaultOptions, useAoTokens } from "~tokens/hooks";
import { useMemo, useCallback, useState, useRef, useEffect } from "react";
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
  getAoxBridgeTransactions,
  getVentoBridgeTransactions,
  isAoxBridgeTokenPair,
  isVentoBridgeTokenPair,
  validateAoxBridgeTransaction,
  validateVentoBridgeTransaction,
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
import { retryWithDelay } from "~utils/promises/retry";
import { sleep } from "~utils/promises/sleep";
import { arweave } from "~utils/agents/utils";

const TEN_SECONDS_MS = 10000;
const FIFTEEN_SECONDS_MS = 15000;

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
  const currentRequestRef = useRef<number>(0);
  const { data: aoxBridgeInfo } = useAoxBridgeInfo({ enabled: isAoxBridgeTokenPair(tokenIn, tokenOut) });
  const { data: ventoBridgeInfo } = useVentoBridgeInfo({ enabled: isVentoBridgeTokenPair(tokenIn, tokenOut) });

  const pairPools = useMemo(() => {
    if (!tokenIn || !tokenOut) return { botega: [], permaswap: [], aox: [], vento: [] };
    const key = [tokenIn, tokenOut].sort().join("-");
    return tokenPools[key] || { botega: [], permaswap: [], aox: [], vento: [] };
  }, [tokenPools, tokenIn, tokenOut]);

  useAsyncEffect(async () => {
    // Generate unique request ID to track this specific request
    const requestId = ++currentRequestRef.current;

    try {
      if (isLoadingPools) return;

      const isValidInput = !!(tokenIn && tokenOut && slippage && amountIn && !isNaN(wanderFeePercent));
      const hasNoPools = Object.values(pairPools).every((pools) => pools.length === 0);

      if (!isValidInput || hasNoPools) {
        setSelectedPoolInfo(null);
        setError(
          amountIn && tokenIn && tokenOut && hasNoPools ? browser.i18n.getMessage("no_liquidity_pools_found") : null,
        );
        return;
      }

      setIsLoading(true);
      setError(null);
      setSelectedPoolInfo(null);

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
        const aoxOutput = await retryWithDelay(
          () =>
            aox.getExpectedOutput({
              poolId: aoxPool.poolId,
              tokenIn,
              amountIn,
              wanderFee,
            }),
          2,
        );

        // Validate this response is for the current request
        if (currentRequestRef.current === requestId) {
          setSelectedPoolInfo({
            poolId: aoxPool.poolId,
            poolType: aoxPool.poolType,
            quoteOutput: aoxOutput,
            priceImpact: "0.00",
          });
          setError(null);
        }

        return;
      }

      if (isVentoBridgeTokenPair(tokenIn, tokenOut)) {
        const validationError = validateVentoBridgeTransaction(amountIn, wanderFee, ventoBridgeInfo, tokenIn, tokenOut);
        if (validationError) {
          setError(validationError);
          return;
        }

        const ventoPool = pairPools?.vento?.[0];
        const ventoOutput = await retryWithDelay(
          () =>
            vento.getExpectedOutput({
              poolId: ventoPool.poolId,
              tokenIn,
              amountIn,
              wanderFee,
            }),
          2,
        );

        // Validate this response is for the current request
        if (currentRequestRef.current === requestId) {
          setSelectedPoolInfo({
            poolId: ventoPool.poolId,
            poolType: ventoPool.poolType,
            quoteOutput: ventoOutput,
            priceImpact: "0.00",
          });
          setError(null);
        }

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
        retryWithDelay(() => botega.getExpectedOutput({ poolId: botegaPool?.poolId, ...params }), 2),
        retryWithDelay(() => permaswap.getExpectedOutput({ poolId: permaswapPool?.poolId, ...params }), 2),
      ]);

      // Check if request is still current after async DEX operations
      if (currentRequestRef.current !== requestId) return;

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
        // Only set error if this is still the current request
        if (currentRequestRef.current === requestId) {
          setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        }
        return;
      }

      let liquidity: GetLiquidityResponse;

      if (finalOutput.type === "botega") {
        liquidity = await retryWithDelay(
          () => botega.getLiquidity({ poolId: botegaPool.poolId, tokenIn, tokenOut }),
          2,
        );
      } else {
        liquidity = await retryWithDelay(
          () => permaswap.getLiquidity({ poolId: permaswapPool.poolId, tokenIn, tokenOut }),
          2,
        );
      }

      // Check if request is still current after liquidity async operation
      if (currentRequestRef.current !== requestId) return;

      if (!liquidity) {
        log(LOG_GROUP.SWAP, "No liquidity found");
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        return;
      }

      const priceImpact = getPriceImpact(liquidity.reserveIn, liquidity.reserveOut, finalOutput.poolAmountIn);

      // Validate this response is for the current request
      if (currentRequestRef.current === requestId) {
        setSelectedPoolInfo({
          poolId: finalPool.poolId,
          poolType: finalPool.poolType,
          quoteOutput: finalOutput,
          priceImpact,
        });
        TempTransactionStorage.set("last_swap_quote_timestamp", Date.now());
        setError(null);
      }
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error fetching pool for token pair", error);
      // Only set error if this is still the current request
      if (currentRequestRef.current === requestId) {
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
      }
    } finally {
      // Only set loading false if this is still the current request
      if (currentRequestRef.current === requestId) {
        setIsLoading(false);
      }
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

  const wanderFee = useMemo(() => {
    if (!amountIn || !wanderFeePercent || isNaN(wanderFeePercent)) return "0";
    const feeBN = BigNumber(amountIn || "0")
      .multipliedBy(wanderFeePercent || 0)
      .dividedBy(100);
    return feeBN.isNaN() ? "0" : feeBN.toFixed(0, BigNumber.ROUND_DOWN);
  }, [amountIn, wanderFeePercent]);

  const fetchPoolQuote = useCallback(async () => {
    try {
      if (!tokenIn || !tokenOut || !slippage || !amountIn || !poolId || !poolType || !wanderFee || stopFetching) {
        setSelectedPoolInfo(null);
        setError(null);
        return;
      }

      setIsLoading((prev) => prev === false);

      const params = {
        tokenIn,
        amountIn,
        slippage,
        wanderFee,
      };

      const output = await retryWithDelay(() => getExpectedOutputFn(poolType, { poolId, ...params }), 2);

      if (!output) {
        log(LOG_GROUP.SWAP, "No final output found");
        setError(browser.i18n.getMessage("unable_to_retrieve_quote"));
        return;
      }

      let liquidity: GetLiquidityResponse;

      if (output.type === PoolTypeEnum.BOTEGA) {
        liquidity = await retryWithDelay(() => botega.getLiquidity({ poolId, tokenIn, tokenOut }), 2);
      } else {
        liquidity = await retryWithDelay(() => permaswap.getLiquidity({ poolId, tokenIn, tokenOut }), 2);
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
  }, [tokenIn, tokenOut, slippage, amountIn, poolId, poolType, wanderFee, stopFetching]);

  useEffect(() => {
    if (
      !tokenIn ||
      !tokenOut ||
      !slippage ||
      !amountIn ||
      !poolId ||
      !poolType ||
      stopFetching ||
      isAoxBridgeTokenPair(tokenIn, tokenOut) ||
      isVentoBridgeTokenPair(tokenIn, tokenOut)
    ) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const startPolling = async () => {
      const now = Date.now();
      const lastQuoteTime = (await TempTransactionStorage.get<number>("last_swap_quote_timestamp")) ?? now;
      const waitTime = Math.max(0, TEN_SECONDS_MS - (now - lastQuoteTime));

      if (waitTime > 0) await sleep(waitTime);
      if (isCancelled) return;

      fetchPoolQuote();
      intervalId = setInterval(fetchPoolQuote, FIFTEEN_SECONDS_MS);
    };

    startPolling();

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
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

  const poolTokenIds = useMemo(() => new Set(poolTokens.map((token) => token.processId)), [poolTokens]);

  const allTokens = useMemo(() => {
    if (tokenSelectorType === "send") {
      return userTokens.filter((token) => poolTokenIds.has(token.id) && token.id !== filterTokenId);
    }
    return poolTokens.filter((token) => token.processId !== filterTokenId && token.poolPartners.has(filterTokenId));
  }, [userTokens, poolTokens, tokenSelectorType, filterTokenId, poolTokenIds]);

  const filteredTokens = useMemo(() => {
    if (!searchTerm.trim()) return allTokens;

    const searchLower = searchTerm.toLowerCase();
    return allTokens.filter((token) => {
      const name = token.Name?.toLowerCase() || "";
      const symbol = token.Ticker?.toLowerCase() || "";
      return name.includes(searchLower) || symbol.includes(searchLower);
    });
  }, [allTokens, searchTerm]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["tokens-with-pagination", searchTerm.trim(), tokenSelectorType, filterTokenId],
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

export function useARNetworkFee({
  tokenIn,
  tokenOut,
  doubleFee = true,
}: {
  tokenIn: string;
  tokenOut: string;
  doubleFee?: boolean;
}) {
  const [baseNetworkFee, setBaseNetworkFee] = useState<string>("0");
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
      setBaseNetworkFee("0");
      return;
    }

    setIsLoading(true);

    try {
      const { result: txPrice } = await retryWithGateways((arweave) =>
        arweave.transactions.getPrice(0, isAoxBridge ? aoxBridgeInfo.arToken.locker : VENTO_BRIDGE_ADDRESS),
      );

      setBaseNetworkFee(txPrice);
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error calculating network fee:", error);
      setBaseNetworkFee("0");
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn, tokenOut, aoxBridgeInfo, isAoxBridge]);

  const networkFee = useMemo(() => {
    // twice the network fee if doubleFee is true to account for the wander fee to be paid
    const fee = BigNumber(baseNetworkFee || "0").multipliedBy(doubleFee ? 2 : 1);
    return fee.isNaN() ? "0" : fee.toFixed();
  }, [baseNetworkFee, doubleFee]);

  const networkFeeValue = useMemo(() => arweave.ar.winstonToAr(networkFee || "0"), [networkFee]);

  return { networkFee, networkFeeValue, isLoading };
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

const hasChangedCursor = (newCursor: string, oldCursor: string) => newCursor !== oldCursor;

const hasNextPageData = (data: any, newCursor: string, oldCursor: string) =>
  data.hasNextPage && hasChangedCursor(newCursor, oldCursor);

export const useSwapTransactions = () => {
  const activeAddress = useActiveAddress();
  const [swaps = []] = useStorage<SwapData[]>({ key: "swaps", instance: ExtensionStorage }, []);

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

  const recentSwaps = useMemo(
    () => convertSwapsArrayToParsedTransactions(swaps, activeAddress),
    [swaps, activeAddress],
  );

  const transactions = useMemo(() => {
    if (!data?.pages?.length) return [];

    const seenIds = new Set<string>();
    const allTransactions = [...data.pages.flatMap((page) => page.transactions), ...recentSwaps];

    return allTransactions
      .filter((tx) => {
        const isDuplicate = seenIds.has(tx.txId);
        seenIds.add(tx.txId);
        return !isDuplicate;
      })
      .sort(sortTransactionsByTimestamp);
  }, [data?.pages, recentSwaps]);

  return {
    transactions,
    loading: isLoading || isFetching || isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
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

    const valueBN = BigNumber(valueIn);

    const originalFee = toFixed(
      valueBN.multipliedBy(defiFeeDetails.originalFeePercent).dividedBy(100),
      token.Denomination,
    );

    const finalFee = toFixed(valueBN.multipliedBy(defiFeeDetails.finalFeePercent).dividedBy(100), token.Denomination);

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
  return useMemo(
    () => calculateNetworkProviderFee(selectedPoolInfo, sendToken, receiveToken, networkFee),
    [selectedPoolInfo, sendToken, receiveToken, networkFee],
  );
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
  return useMemo(
    () => calculateRate(selectedPoolInfo, sendToken, receiveToken, amountIn),
    [selectedPoolInfo, sendToken, receiveToken, amountIn],
  );
}

export function useIsSwapGated() {
  const { data: activeTier } = useActiveTier();

  return useMemo(() => {
    const tierId = tierNameToId[activeTier?.tier || TierTypes.Core];
    return tierId > RESERVE_TIER_ID && SWAP_DISABLED_FOR_LOWER_TIERS;
  }, [activeTier?.tier]);
}
