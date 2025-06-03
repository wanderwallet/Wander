import { useQuery } from "@tanstack/react-query";
import { LiquidOpsClient } from "../LiquidOps";
import { getActiveAddress } from "~wallets";
import { fetchTokenBalance } from "~tokens/aoTokens/ao";
import { tokenData } from "liquidops";
import { Quantity } from "ao-tokens";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export function useEarnings(ticker: string) {
  return useQuery({
    queryKey: ["earnings", ticker],
    queryFn: async () => {
      const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
      const token = activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());

      try {
        const walletAddress = await getActiveAddress();
        const client = await LiquidOpsClient();

        const { collateralization } = await client.getPosition({
          token: ticker.toUpperCase(),
          recipient: walletAddress,
        });
        const earnings = await client.getEarnings({
          token: ticker.toUpperCase(),
          collateralization: BigInt(collateralization),
          walletAddress: walletAddress,
        });

        return new Quantity(earnings.profit || 0n, token.baseDenomination);
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || new Quantity(0n, 0n),
    enabled: !!ticker,
  });
}
