import { useQuery } from "@tanstack/react-query";
import { tokenData } from "liquidops";
import { LiquidOpsClient } from "../LiquidOps";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export function useAPYOrder() {
  return useQuery({
    queryKey: ["apyOrder"],
    queryFn: async () => {
      const { client } = await LiquidOpsClient();
      const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

      const res: [string, number][] = await Promise.all(
        activeTokens.map(async (token) => {
          let res = 0;

          try {
            res =
              (await client.getSupplyAPR({
                token: token.ticker.toUpperCase(),
              })) || 0;
          } catch (e) {
            console.log(e);
          }

          return [token.ticker, res];
        }),
      );

      return Object.fromEntries(res);
    },
    ...defaultOptions,
    select: (data) => data || {},
  });
}
