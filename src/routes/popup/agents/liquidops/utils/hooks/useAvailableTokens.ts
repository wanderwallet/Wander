import { useStorage } from "@plasmohq/storage/hook";
import { useQuery } from "@tanstack/react-query";
import { Quantity } from "ao-tokens";
import BigNumber from "bignumber.js";
import { tokenData, type TokenData } from "liquidops";
import { ExtensionStorage } from "~utils/storage";
import { LiquidOpsClient } from "../LiquidOps";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export interface ActiveAgentToken extends TokenData {
  balance: BigNumber;
  profit: BigNumber;
}

export function useActiveTokens() {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  return useQuery({
    queryKey: ["activeTokens", activeAddress],
    queryFn: async () => {
      const { client } = await LiquidOpsClient();
      const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

      const res = await Promise.all(
        activeTokens.map(async (token) => {
          try {
            const position = await client.getPosition({
              token: token.ticker.toUpperCase(),
              recipient: activeAddress,
            });
            const collateralization = BigInt(position.collateralization);
            if (collateralization === 0n) {
              return undefined;
            }

            let profit = BigNumber(0);
            try {
              const earnings = await client.getEarnings({
                token: token.ticker.toUpperCase(),
                walletAddress: activeAddress,
                collateralization,
              });

              profit = BigNumber(new Quantity(earnings.profit, token.baseDenomination).toString());
            } catch {}

            return <ActiveAgentToken>{
              ...token,
              balance: BigNumber(new Quantity(position.collateralization, token.baseDenomination).toString()),
              profit,
            };
          } catch {
            return undefined;
          }
        }),
      );

      return res.filter((t) => typeof t !== "undefined");
    },
    ...defaultOptions,
    select: (data) => data || [],
  });
}
