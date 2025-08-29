import { useState, useEffect } from "react";
import { getMarketChart, type CoinGeckoSymbol } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { ExtensionStorage } from "~utils/storage";
import BigNumber from "bignumber.js";

export interface SavedMarketData {
  prices: [number, number][];
  timestamp: string;
}

export function useTokenMarketData(symbol: CoinGeckoSymbol, days = "1") {
  const [currency = "USD"] = useSetting("currency");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [chartData, setChartData] = useState<[number, number][]>([]);
  const [priceChangePercentage, setPriceChangePercentage] = useState<BigNumber>(new BigNumber(0));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      setChartData([]);
      setPriceChangePercentage(new BigNumber(0));

      try {
        const savedMarketData = await ExtensionStorage.get<SavedMarketData>(`saved_market_data_${symbol}_${days}`);
        // fresh is considered less than 5 min old
        const isFresh =
          savedMarketData?.timestamp && Date.now() - new Date(savedMarketData.timestamp).getTime() < 5 * 60 * 1000;

        const prices = isFresh
          ? savedMarketData.prices
          : (await getMarketChart(symbol, currency.toLowerCase(), days)).prices;

        setChartData(prices);
        const startPrice = prices[0][1];
        const endPrice = prices[prices.length - 1][1];

        const change = new BigNumber(endPrice).minus(startPrice).dividedBy(startPrice).multipliedBy(100);
        setPriceChangePercentage(change);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currency, days]);

  return { chartData, loading, priceChangePercentage, error };
}
