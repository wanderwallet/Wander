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

export function useActiveTokens() {
  return useQuery({
    queryKey: ["activeTokens"],
    queryFn: async () => {
      try {
        const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
        const tickersWithBalance = [];

        // Check balance for each token
        for (const token of activeTokens) {
          const tokenObj = {
            Name: token.name,
            Denomination: Number(token.denomination),
            processId: token.oAddress,
          };

          try {
            const balance = await fetchTokenBalance(tokenObj, token.oAddress);
            const balanceNum = parseFloat(balance);

            if (balanceNum > 0) {
              tickersWithBalance.push({
                ticker: token.ticker,
                balance: balance,
                name: token.name,
                address: token.address,
                oAddress: token.oAddress,
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch balance for ${token.ticker}:`, error);
            // Continue with other tokens even if one fails
          }
        }

        return tickersWithBalance;
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || [],
  });
}
