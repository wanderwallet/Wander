import { useQuery } from "@tanstack/react-query";
import { LiquidOpsClient } from "../LiquidOps";
import { tokenData } from "liquidops";
import { Quantity } from "ao-tokens";
import BigNumber from "bignumber.js";
import { ExtensionStorage, useStorage } from "~utils/storage";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export function useEarnings(ticker: string) {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  return useQuery<{
    profit: BigNumber;
    startDate?: number;
  }>({
    queryKey: ["earnings", ticker, activeAddress],
    queryFn: async () => {
      const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
      const token = activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());

      try {
        const { client } = await LiquidOpsClient();

        const { collateralization } = await client.getPosition({
          token: ticker.toUpperCase(),
          recipient: activeAddress,
        });
        const earnings = await client.getEarnings({
          token: ticker.toUpperCase(),
          collateralization: BigInt(collateralization),
          walletAddress: activeAddress,
        });

        return {
          profit: BigNumber(new Quantity(earnings.profit || 0n, token.baseDenomination).toString()),
          startDate: earnings.startDate,
        };
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || { profit: BigNumber(0) },
    enabled: !!ticker,
  });
}
