import { useQuery } from "@tanstack/react-query";
import { LiquidOpsClient } from "../LiquidOps";
import { getActiveAddress } from "~wallets";
import { fetchTokenBalance } from "~tokens/aoTokens/ao";
import { tokenData } from "liquidops";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export function useEarnings(ticker: string, refresh?: boolean) {
  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const token = activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());

  const tokenObj = {
    Name: token.name,
    Denomination: Number(token.denomination),
    processId: token.oAddress,
  };

  return useQuery({
    queryKey: ["earnings", ticker],
    queryFn: async () => {
      try {
        const oTokenBalance = await fetchTokenBalance(tokenObj, token.oAddress, refresh);
        const walletAddress = await getActiveAddress();
        const client = await LiquidOpsClient();
        const earnings = await client.getEarnings({
          token: ticker.toUpperCase(),
          collateralization: BigInt(oTokenBalance),
          walletAddress: walletAddress,
        });
        return earnings.profit || "0";
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || "0",
    enabled: !!ticker,
  });
}
