import { useQueries, useQuery } from "@tanstack/react-query";
import { LiquidOpsClient } from "../LiquidOps";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

async function getLOSupplyAPY(ticker: string) {
  try {
    const { client } = await LiquidOpsClient();
    const apr = await client.getSupplyAPR({ token: ticker.toUpperCase() });

    return apr || 0;
  } catch (error) {
    throw error;
  }
}

export function useLOSupplyAPY(ticker: string) {
  return useQuery({
    queryKey: ["liquidopsTokenAPY", ticker],
    queryFn: () => getLOSupplyAPY(ticker),
    ...defaultOptions,
    select: (data) => data || 0,
    enabled: !!ticker,
  });
}

export function useLOSupplyAPYs(tickers: string[]) {
  return useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: ["liquidopsTokenAPY", ticker],
      queryFn: () => getLOSupplyAPY(ticker),
      ...defaultOptions,
      select: (data) => data || 0,
      enabled: !!ticker,
    })),
  });
}
