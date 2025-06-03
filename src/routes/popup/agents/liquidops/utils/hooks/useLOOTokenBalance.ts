import { useQuery } from "@tanstack/react-query";
import { Quantity } from "ao-tokens";
import { tokenData } from "liquidops";
import { useMemo } from "react";
import { fetchTokenBalance } from "~tokens/aoTokens/ao";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export function useLOOTokenBalance(ticker: string, refresh?: boolean) {
  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [ticker, activeTokens],
  );

  return useQuery({
    queryKey: ["tokenBalance", token.address],
    queryFn: async () => {
      const tokenObj = {
        Name: token.name,
        Denomination: Number(token.denomination),
        processId: token.oAddress,
      };

      try {
        const balance = await fetchTokenBalance(tokenObj, token.oAddress, refresh);

        return new Quantity(balance || 0n, token.denomination);
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || new Quantity(0n, 0n),
    enabled: !!ticker,
  });
}
