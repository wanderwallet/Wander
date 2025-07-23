import { useState, useEffect } from "react";
import { getMarketChart } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import { ExtensionStorage, useStorage } from "~utils/storage";
import BigNumber from "bignumber.js";

export function useArChange(fiat?: BigNumber) {
  const [currency = "USD"] = useSetting("currency");
  const [percentage, setPercentage] = useState(BigNumber("0"));
  const [savedAr24hChange] = useStorage<{
    value: number;
    timestamp: string;
  }>({ key: "saved_ar_24h_change", instance: ExtensionStorage });

  useEffect(() => {
    if (!currency) return;

    (async () => {
      try {
        // Check for cached market data
        const savedData = await ExtensionStorage.get<{
          prices: [number, number][];
          timestamp: string;
        }>(`saved_market_data_1`);
        if (savedData) {
          const { prices, timestamp } = savedData;
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

          if (new Date(timestamp).getTime() > fiveMinutesAgo) {
            const startPrice = prices[0][1];
            const endPrice = prices[prices.length - 1][1];
            const change = ((endPrice - startPrice) / startPrice) * 100;
            setPercentage(BigNumber(change));
            return;
          }
        }

        // If no valid cached data, fetch new data
        const data = await getMarketChart(currency.toLowerCase(), "1");
        const prices = data.prices;
        const startPrice = prices[0][1];
        const endPrice = prices[prices.length - 1][1];
        const change = ((endPrice - startPrice) / startPrice) * 100;
        setPercentage(BigNumber(change));
      } catch (error) {
        console.error("Error calculating price change:", error);
        if (savedAr24hChange) {
          setPercentage(BigNumber(savedAr24hChange.value));
        } else {
          setPercentage(BigNumber(0));
        }
      }
    })();
  }, [currency]);

  return {
    percentage,
    fiatChange: fiat ? formatFiatBalance(fiat.multipliedBy(percentage.dividedBy(100)), currency.toLowerCase()) : null,
  };
}
