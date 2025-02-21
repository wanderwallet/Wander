import { useQuery, useQueries } from "@tanstack/react-query";
import {
  fetchTokenBalance,
  getBotegaPrice,
  getBotegaPrices,
  useAoTokens,
  type TokenInfo
} from "./aoTokens/ao";
import { useMemo } from "react";
import useSetting from "~settings/hook";
import { getConversionRate } from "~utils/currency";
import BigNumber from "bignumber.js";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { EXP_TOKEN } from "~utils/ao_import";
import { useArPrice } from "~lib/coingecko";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true
};

export const defaultQueryCache = {
  queryFn: () => null,
  enabled: false,
  staleTime: Infinity
};

export const useConversionRate = (currency: string) =>
  useQuery({
    queryKey: ["conversionRate", currency],
    queryFn: () => getConversionRate(currency),
    enabled: !!currency,
    ...defaultOptions
  });

export function useQueryCache<T = unknown>(queryKey: unknown[]) {
  return useQuery({ ...defaultQueryCache, queryKey });
}

export function useTokenBalance(
  token: TokenInfo,
  address: string,
  refresh?: boolean
) {
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
    enabled: !!address
  });
}

export function useTokenPrice(id?: string, currency = "USD") {
  const isArToken = id === "AR";

  const conversionRateQuery = useConversionRate(currency);

  const priceQuery = useQuery({
    queryKey: ["tokenPrice", id],
    queryFn: () => getBotegaPrice(id!),
    enabled: !!id && !isArToken,
    ...defaultOptions
  });

  const { data: arPrice = "0", isLoading } = useArPrice(currency);

  const convertedPrice = useMemo(() => {
    if (isArToken) return +arPrice;
    if (!priceQuery.data || !conversionRateQuery.data) return null;
    return priceQuery.data * (conversionRateQuery.data || 1);
  }, [priceQuery.data, conversionRateQuery.data, arPrice]);

  return {
    hasPrice: isArToken
      ? !!arPrice && arPrice !== "0"
      : priceQuery.data !== null,
    loading: isArToken
      ? isLoading
      : priceQuery.isLoading || conversionRateQuery.isLoading,
    price: convertedPrice
  };
}

export function useTokenPrices(ids?: string[]) {
  const [currency = "USD"] = useSetting("currency");

  const conversionRateQuery = useConversionRate(currency);

  const pricesQuery = useQuery({
    queryKey: ["tokenPrices", ids?.slice().sort().join(",")],
    queryFn: () => getBotegaPrices(ids!),
    enabled: !!ids?.length,
    ...defaultOptions
  });

  const { data: arPrice = "0" } = useArPrice(currency);

  const convertedPrices = useMemo(() => {
    if (!pricesQuery.data) return { AR: +arPrice };

    const pricesEntries = (ids || []).map((id) => [
      id,
      pricesQuery.data[id] !== null
        ? pricesQuery.data[id] * (conversionRateQuery.data || 1)
        : null
    ]);

    pricesEntries.push(["AR", +arPrice]);

    return Object.fromEntries(pricesEntries) as Record<string, number>;
  }, [ids, pricesQuery.data, conversionRateQuery.data, arPrice]);

  return {
    prices: convertedPrices,
    loading: pricesQuery.isLoading || conversionRateQuery.isLoading
  };
}

export function useTotalFiatBalance() {
  const { tokens } = useAoTokens({ type: "asset", hidden: false });
  const [address] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });
  const [currency] = useSetting("currency");

  const { data: arPrice = "0" } = useArPrice(currency);

  const conversionRateQuery = useQueryCache<number>([
    "conversionRate",
    currency
  ]);

  const tokenIds = tokens
    .map((token) => token.id)
    .filter((id) => id !== EXP_TOKEN && id !== "AR");

  const pricesQuery = useQueryCache<Record<string, number>>([
    "botegaPrices",
    tokenIds?.slice().sort().join(",")
  ]);

  const tokenBalanceQueries = useQueries({
    queries: tokens.map((token) => ({
      queryKey: ["tokenBalance", token.id, address],
      ...defaultQueryCache
    }))
  });

  return useMemo(() => {
    if (!address) return BigNumber(0);
    let total = BigNumber(0);

    const conversionRate = conversionRateQuery.data || 1;

    tokens.forEach((token, index) => {
      const balance = tokenBalanceQueries[index].data;
      const price =
        token.id === "AR" ? +arPrice : pricesQuery.data?.[token.id] || 0;

      if (balance && price) {
        total = total.plus(
          BigNumber(balance).times(price).times(conversionRate)
        );
      }
    });

    return total;
  }, [
    tokens,
    address,
    conversionRateQuery.data,
    pricesQuery.data,
    tokenBalanceQueries
  ]);
}
