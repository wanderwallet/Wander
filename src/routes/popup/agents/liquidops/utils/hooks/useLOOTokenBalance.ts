import { useStorage } from "@plasmohq/storage/hook";
import { useQuery } from "@tanstack/react-query";
import { tokenData } from "liquidops";
import { useMemo } from "react";
import { fetchTokenBalance } from "~tokens/aoTokens/ao";
import { ExtensionStorage } from "~utils/storage";
import BigNumber from "bignumber.js";

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

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  return useQuery({
    queryKey: ["tokenBalance", token.address, activeAddress],
    queryFn: async () => {
      const tokenObj = {
        Name: token.name,
        Denomination: Number(token.denomination),
        processId: token.oAddress,
      };

      try {
        const balance = await fetchTokenBalance(tokenObj, activeAddress, refresh);

        return BigNumber(balance || 0);
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || BigNumber(0),
    enabled: !!ticker,
  });
}
