import type { GetPriceOptions } from "redstone-api/lib/types";
import { useEffect, useState } from "react";
import useSetting from "~settings/hook";
import redstone from "redstone-api";
import { getPrice } from "./coingecko";
import BigNumber from "bignumber.js";

/**
 * Hook for the redstone token price API
 *
 * @param symbol Token symbol
 * @param isAoToken Token is ao token or not
 * @param opts Custom Redstone API "getPrice" options
 */
export function usePrice(symbol?: string, isAoToken?: boolean, opts?: GetPriceOptions) {
  const [price, setPrice] = useState<BigNumber>();
  const [loading, setLoading] = useState(false);

  // currency setting
  const [currency] = useSetting<string>("currency");

  useEffect(() => {
    (async () => {
      if (!symbol || isAoToken) {
        return;
      }

      setLoading(true);

      try {
        // fetch price from redstone
        const res = await redstone.getPrice(symbol, opts);

        if (!res?.value) {
          return setPrice(undefined);
        }

        // get price in currency
        const multiplier = currency !== "usd" ? await getPrice("usd", currency) : 1;

        setPrice(BigNumber(res.value).multipliedBy(multiplier));
      } catch {}

      setLoading(false);
    })();
  }, [symbol, opts, currency]);

  return { price, currency, loading };
}

// May 27, 2020
const FIRST_AR_PRICE_DATE = new Date(1590530400000);

/**
 * Hook for the redstone token prices API
 *
 * @param period Price period
 * @param symbol Token symbol
 */
export function usePriceHistory(period: string, symbol?: string) {
  const [prices, setPrices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // period date values
  const startDates: Record<string, number> = {
    Day: new Date().setDate(new Date().getDate() - 1),
    Week: new Date().setDate(new Date().getDate() - 7),
    Month: new Date().setMonth(new Date().getMonth() - 1),
    Year: new Date().setMonth(new Date().getMonth() - 12),
    All: FIRST_AR_PRICE_DATE.getTime(),
  };

  // intervals for periods
  const intervals: Record<string, number> = {
    Day: 3600 * 100, // hour / 10
    Week: 3600 * 1000, // hourly
    Month: 3600 * 1000 * 24, // daily
    Year: 3600 * 1000 * 24 * 25, // a bit less than a month
    All: 3600 * 1000 * 24 * 31, // monthly
  };

  useEffect(() => {
    (async () => {
      if (!symbol) {
        return;
      }

      setLoading(true);

      try {
        const res = await redstone.getHistoricalPrice(symbol, {
          startDate: startDates[period],
          endDate: new Date().getTime(),
          interval: intervals[period],
        });

        setPrices(res.map((p) => p.value));
      } catch {}

      setLoading(false);
    })();
  }, [symbol, period]);

  return { prices, loading };
}
