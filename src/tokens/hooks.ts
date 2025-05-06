import { useQuery, useQueries } from "@tanstack/react-query";
import {
  fetchTokenBalance,
  getBotegaPrice,
  getBotegaPrices,
  type TokenInfo,
  type TokenInfoWithBalance,
} from "./aoTokens/ao";
import { useMemo } from "react";
import useSetting from "~settings/hook";
import { getConversionRate } from "~utils/currency";
import BigNumber from "bignumber.js";
import { ExtensionStorage, PersistentStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { AO_NATIVE_TOKEN, EXP_TOKEN } from "~utils/ao_import";
import { useArPrice } from "~lib/coingecko";
import { defaultConfig } from "./aoTokens/config";
import { connect } from "@permaweb/aoconnect";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export const defaultQueryCache = {
  queryFn: () => null,
  enabled: false,
  staleTime: Infinity,
};

export const useConversionRate = (currency: string) =>
  useQuery({
    queryKey: ["conversionRate", currency],
    queryFn: () => getConversionRate(currency),
    enabled: !!currency,
    ...defaultOptions,
  });

export function useQueryCache<T = unknown>(queryKey: unknown[]) {
  return useQuery({ ...defaultQueryCache, queryKey });
}

export function useTokenBalance(token: TokenInfo, address: string, refresh?: boolean) {
  return useQuery({
    queryKey: ["tokenBalance", token.processId, address],
    queryFn: async () => {
      try {
        const balance = await fetchTokenBalance(token, address, refresh);
        return balance || "0";
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || "0",
    enabled: !!address && !!token.processId && isFinite(token?.Denomination),
  });
}

export function useTokenPrice(id?: string, currency = "USD") {
  const isArToken = id === "AR";

  const conversionRateQuery = useConversionRate(currency);

  const priceQuery = useQuery({
    queryKey: ["tokenPrice", id],
    queryFn: () => getBotegaPrice(id!),
    // queryFn: () => null,
    enabled: !!id && !isArToken,
    ...defaultOptions,
  });

  const { data: arPrice = "0", isLoading } = useArPrice(currency);

  const convertedPrice = useMemo(() => {
    if (isArToken) return +arPrice;
    if (!priceQuery.data || !conversionRateQuery.data) return null;
    return priceQuery.data * (conversionRateQuery.data || 1);
  }, [priceQuery.data, conversionRateQuery.data, arPrice]);

  return {
    hasPrice: isArToken ? !!arPrice && arPrice !== "0" : priceQuery.data !== null,
    loading: isArToken ? isLoading : priceQuery.isLoading || conversionRateQuery.isLoading,
    price: convertedPrice,
  };
}

export function useTokenPrices(ids?: string[]) {
  const [currency = "USD"] = useSetting("currency");

  const conversionRateQuery = useConversionRate(currency);

  const pricesQuery = useQuery({
    queryKey: ["tokenPrices", ids?.slice().sort().join(",")],
    queryFn: () => getBotegaPrices(ids!),
    // queryFn: () => null,
    enabled: !!ids?.length,
    ...defaultOptions,
  });

  const { data: arPrice = "0" } = useArPrice(currency);

  const convertedPrices = useMemo(() => {
    if (!pricesQuery.data) return { AR: +arPrice };

    const pricesEntries = (ids || []).map((id) => [
      id,
      pricesQuery.data[id] !== null ? pricesQuery.data[id] * (conversionRateQuery.data || 1) : null,
    ]);

    pricesEntries.push(["AR", +arPrice]);

    return Object.fromEntries(pricesEntries) as Record<string, number>;
  }, [ids, pricesQuery.data, conversionRateQuery.data, arPrice]);

  return {
    prices: convertedPrices,
    loading: pricesQuery.isLoading || conversionRateQuery.isLoading,
  };
}

export function useTotalFiatBalance() {
  const { tokens } = useAoTokens({ type: "asset", hidden: false });
  const [address] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });
  const [currency] = useSetting("currency");

  const { data: arPrice = "0" } = useArPrice(currency);

  const conversionRateQuery = useQueryCache<number>(["conversionRate", currency]);

  const tokenIds = tokens.map((token) => token.id).filter((id) => id !== EXP_TOKEN && id !== "AR");

  const pricesQuery = useQueryCache<Record<string, number>>(["tokenPrices", tokenIds?.slice().sort().join(",")]);

  const tokenBalanceQueries = useQueries({
    queries: tokens.map((token) => ({
      queryKey: ["tokenBalance", token.id, address],
      ...defaultQueryCache,
    })),
  });

  return useMemo(() => {
    if (!address) return BigNumber(0);
    let total = BigNumber(0);

    const conversionRate = conversionRateQuery.data || 1;

    tokens.forEach((token, index) => {
      const balance = tokenBalanceQueries[index].data;
      const price = token.id === "AR" ? +arPrice : pricesQuery.data?.[token.id] || 0;

      if (balance && price) {
        total = total.plus(BigNumber(balance).times(price).times(conversionRate));
      }
    });

    return total;
  }, [tokens, address, conversionRateQuery.data, pricesQuery.data, tokenBalanceQueries, arPrice]);
}

export function useAo() {
  // ao instance
  const ao = useMemo(() => connect(defaultConfig), []);

  return ao;
}

function moveTokenToTop(tokens: TokenInfoWithBalance[], tokenId: string) {
  const tokenIndex = tokens.findIndex((t) => t.id === tokenId);
  if (tokenIndex !== -1) {
    const token = tokens.splice(tokenIndex, 1)[0];
    tokens.unshift(token);
  }
}

export function useAoTokens({
  type,
  hidden,
  sortFn,
  skipSort = false,
}: {
  type?: "asset" | "collectible";
  hidden?: boolean;
  sortFn?: (a: TokenInfo, b: TokenInfo) => number;
  skipSort?: boolean;
} = {}): {
  tokens: TokenInfoWithBalance[];
  loading: boolean;
  changeTokenVisibility: (tokenId: string, hidden: boolean) => void;
} {
  const [aoTokens, setAoTokens] = useStorage<TokenInfo[]>(
    {
      key: "ao_tokens",
      instance: PersistentStorage,
    },
    [],
  );

  const changeTokenVisibility = (tokenId: string, hidden: boolean) => {
    setAoTokens((tokens) => tokens.map((t) => (t.processId === tokenId ? { ...t, hidden } : t)));
  };

  // fetch token infos
  const tokens = useMemo(() => {
    const filteredTokens = aoTokens
      .filter((t) => {
        const typeMatch =
          !type ||
          (type === "asset" && (t.type === "asset" || !t.type)) ||
          (type === "collectible" && t.type === "collectible");

        const hiddenMatch = hidden === undefined || (t.hidden ?? false) === hidden;

        return typeMatch && hiddenMatch;
      })
      .map((aoToken) => ({
        id: aoToken.processId,
        balance: "0",
        Ticker: aoToken.Ticker,
        Name: aoToken.Name,
        Denomination: Number(aoToken.Denomination || 0),
        Logo: aoToken?.Logo,
        type: aoToken.type || "asset",
        hidden: aoToken?.hidden ?? false,
      }));

    if (!skipSort) {
      moveTokenToTop(filteredTokens, AO_NATIVE_TOKEN);
      moveTokenToTop(filteredTokens, "AR");

      if (sortFn) {
        filteredTokens.sort(sortFn);
      }
    }

    return filteredTokens;
  }, [aoTokens, type, hidden, sortFn, skipSort]);

  return { tokens, loading: false, changeTokenVisibility };
}

export function useBalanceSortedTokens({
  type,
  hidden,
}: {
  type?: "asset" | "collectible";
  hidden?: boolean;
} = {}): {
  tokens: TokenInfoWithBalance[];
  loading: boolean;
  prices: Record<string, number | null>;
} {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const [aoTokens] = useStorage<TokenInfo[]>(
    {
      key: "ao_tokens",
      instance: PersistentStorage,
    },
    [],
  );

  const tokensByHidden = useMemo(
    () =>
      aoTokens.filter((t) => {
        const typeMatch =
          !type ||
          (type === "asset" && (t.type === "asset" || !t.type)) ||
          (type === "collectible" && t.type === "collectible");

        const hiddenMatch = hidden === undefined || (t.hidden ?? false) === hidden;

        return typeMatch && hiddenMatch;
      }),
    [aoTokens, type, hidden],
  );

  const { prices } = useTokenPrices(
    tokensByHidden.map((t) => t.processId).filter((id) => id !== "AR" && id !== EXP_TOKEN),
  );

  const tokenBalanceQueries = useQueries({
    queries: tokensByHidden.map((token) => ({
      queryKey: ["tokenBalance", token.processId, activeAddress],
      ...defaultQueryCache,
    })),
  });

  // fetch token infos
  const tokens = useMemo(() => {
    const filteredTokens = tokensByHidden.map((aoToken, index) => ({
      id: aoToken.processId,
      balance: tokenBalanceQueries[index].data || "0",
      Ticker: aoToken.Ticker,
      Name: aoToken.Name,
      Denomination: Number(aoToken.Denomination || 0),
      Logo: aoToken?.Logo,
      type: aoToken.type || "asset",
      hidden: aoToken?.hidden ?? false,
      fiatBalance: BigNumber(tokenBalanceQueries[index].data || "0")
        .times(prices[aoToken.processId] || 0)
        .toString(),
    }));

    const sortedTokens = filteredTokens.sort((a, b) => {
      // If both tokens have fiat balance, compare those
      if (+a.fiatBalance && +b.fiatBalance) {
        return +b.fiatBalance - +a.fiatBalance;
      }
      // If only one has fiat balance, prioritize it
      if (+a.fiatBalance) return -1;
      if (+b.fiatBalance) return 1;
      // If neither has fiat balance, compare token balances
      return +b.balance - +a.balance;
    });

    moveTokenToTop(sortedTokens, AO_NATIVE_TOKEN);
    moveTokenToTop(sortedTokens, "AR");

    return sortedTokens;
  }, [tokensByHidden, prices, tokenBalanceQueries]);

  return { tokens, loading: false, prices };
}
