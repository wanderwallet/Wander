import { useQuery } from "@tanstack/react-query";
import { tokenData } from "liquidops";
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

  const token = activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());

  const tokenObj = {
    Name: token.name,
    Denomination: Number(token.denomination),
    processId: token.oAddress,
  };

  return useQuery({
    queryKey: ["tokenBalance", token.address],
    queryFn: async () => {
      try {
        const balance = await fetchTokenBalance(tokenObj, token.oAddress, refresh);
        return balance || "0";
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || "0",
    enabled: !!ticker,
  });
}
