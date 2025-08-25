import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import redstone from "redstone-api";
import { getConversionRate } from "~utils/currency";
import { CACHE_API } from "~_constants/api";
import { withRetry } from "~utils/promises/retry";
import { ExtensionStorage, PersistentStorage } from "~utils/storage";

export type CoinGeckoSymbol = "arweave" | "ao-computer";

/**
 * Compare two currencies
 *
 * @param symbol Symbol of the currency to get the price for
 * @param currency What to return the price in
 */
export async function getPrice(symbol: CoinGeckoSymbol, currency: string) {
  try {
    const wanderData = await (
      await fetch(`${CACHE_API}/api/price?symbol=${symbol.toLowerCase()}&currency=${currency.toLowerCase()}`)
    ).json();

    return wanderData.price;
  } catch {
    const data: CoinGeckoPriceResult = await (
      await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=${currency.toLowerCase()}`,
      )
    ).json();

    return data[symbol.toLowerCase()][currency.toLowerCase()];
  }
}

/**
 * Get price for the AR token using the coingecko API
 *
 * @param currency Currency to get the price in
 * @returns Price of 1 AR
 */
export async function getArPrice(currency: string) {
  try {
    return await getPrice("arweave", currency.toLowerCase());
  } catch (error) {
    console.error(error, "redirecting to redstone");

    const res = await redstone.getPrice("AR");

    if (!res.value) throw new Error("No price value returned from Redstone");

    if (res.timestamp && Date.now() - res.timestamp >= 7200000) {
      throw new Error("Price is older than 2 hours");
    }

    const rate = await getConversionRate(currency);

    return BigNumber(res.value).multipliedBy(rate).toFixed();
  }
}

/**
 * Hook to fetch and manage AR token price in React Native
 * @param currency Currency to get the price in
 * @returns Object containing price as BigNumber, loading state, and reload function
 */
export function useArPrice(currency: string) {
  return useQuery({
    queryKey: ["arPrice", currency],
    queryFn: async () => {
      if (!currency) return "0";

      try {
        const result = await withRetry(() => getArPrice(currency), 3, 1000);
        if (result) {
          await PersistentStorage.set("last_saved_price", String(result));
          return String(result);
        }
      } catch (error) {
        const lastPrice = await PersistentStorage.get<string>("last_saved_price");
        if (lastPrice) return lastPrice;
      }
      return "0";
    },
    select: (data) => data || "0",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 30_000,
    staleTime: 30_000,
    gcTime: 30_000,
    enabled: !!currency,
  });
}

/**
 * Get 24-hour price change for the AR token using the CoinGecko API
 *
 * @param currency Currency to get the price change in
 * @returns 24-hour price change percentage of AR
 */
export async function getToken24hChange(symbol: CoinGeckoSymbol, currency: string): Promise<number> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=${currency.toLowerCase()}&include_24hr_change=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const changeKey = `${currency.toLowerCase()}_24h_change`;

    return data[symbol][changeKey];
  } catch (error) {
    throw new Error("Failed to fetch AR price change");
  }
}

interface CoinGeckoMarketChartResult {
  /** Prices: arrany of date in milliseconds and price */
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface CoinGeckoPriceResult {
  arweave: {
    [key: string]: number;
  };
  [key: string]: {
    [key: string]: number;
  };
}

async function fetchCoinGeckoChart(symbol: CoinGeckoSymbol, currency: string, days: string | number) {
  try {
    const response = await fetch(`${CACHE_API}/api/chart?symbol=${symbol}&days=${days}&currency=${currency}`);

    const data = await response.json();

    await ExtensionStorage.set(`saved_market_data_${symbol}_${days}`, {
      prices: data.data.prices,
      // cacheAge minus time now
      timestamp: new Date(Date.now() - data.cacheAge * 1000).toISOString(),
    });

    return data.data;
  } catch (error) {
    const data: CoinGeckoMarketChartResult = await (
      await fetch(`https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=${currency}&days=${days}`)
    ).json();

    if (data.status?.error_code) throw new Error("CoinGecko API error");

    await ExtensionStorage.set(`saved_market_data_${symbol}_${days}`, {
      prices: data.prices,
      timestamp: new Date().toISOString(),
    });

    return data;
  }
}

export async function getMarketChart(symbol: CoinGeckoSymbol, currency: string, days = "max") {
  try {
    return await fetchCoinGeckoChart(symbol, currency, days);
  } catch (error) {
    throw error;
  }
}

interface CoinGeckoMarketChartResult {
  /** Prices: arrany of date in milliseconds and price */
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
  status?: any;
}

interface CoinGeckoMarketStatsResult {
  market_data: {
    market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    fdv_to_tvl_ratio?: number;
    mcap_to_tvl_ratio?: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
  };
}

export async function getMarketStats(symbol: CoinGeckoSymbol, currency: string = "usd") {
  const data: CoinGeckoMarketStatsResult = await (
    await fetch(
      `https://api.coingecko.com/api/v3/coins/${symbol}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    )
  ).json();

  return {
    marketCap: data.market_data.market_cap[currency.toLowerCase()],
    volume24h: data.market_data.total_volume[currency.toLowerCase()],
    fdvRatio: data.market_data.fdv_to_tvl_ratio,
    volMcapRatio: data.market_data.mcap_to_tvl_ratio,
    circulatingSupply: data.market_data.circulating_supply,
    totalSupply: data.market_data.total_supply,
    maxSupply: data.market_data.max_supply,
  };
}
