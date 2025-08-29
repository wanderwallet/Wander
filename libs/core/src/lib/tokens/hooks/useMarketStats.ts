import { useState, useEffect } from "react";
import { getMarketStats, type CoinGeckoSymbol } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { ExtensionStorage, useStorage } from "~utils/storage/storage";

export interface SavedMarketStats {
  marketCap: number;
  volume24h: number;
  fdvRatio?: number;
  volMcapRatio?: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  timestamp: string;
}

export function useMarketStats(symbol: CoinGeckoSymbol) {
  const [currency = "USD"] = useSetting("currency");
  const [loading, setLoading] = useState(false);
  const [marketStats, setMarketStats] = useState<SavedMarketStats | null>(null);
  const [savedMarketStats, setSavedMarketStats] = useStorage<SavedMarketStats>({
    key: `saved_market_stats_${symbol}`,
    instance: ExtensionStorage,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const stats = await getMarketStats(symbol, currency.toLowerCase());
        const formattedStats = {
          ...stats,
          timestamp: new Date().toISOString(),
        };
        setMarketStats(formattedStats);
        setSavedMarketStats(formattedStats);
      } catch (error) {
        console.warn("Market stats fetch error:", error);
        if (savedMarketStats) {
          setMarketStats(savedMarketStats);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currency]);

  return { marketStats, loading };
}
