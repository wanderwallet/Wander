import { useQuery } from "@tanstack/react-query";
import { tokenData } from "liquidops";
import { useMemo } from "react";
import { LiquidOpsClient } from "../LiquidOps";
import { Quantity } from "ao-tokens";
import BigNumber from "bignumber.js";

export function useOExchangeRate(ticker: string, quantity: string) {
  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [ticker, activeTokens],
  );

  return useQuery({
    queryKey: ["exchangeRate", token?.ticker, quantity],
    queryFn: async () => {
      if (!token) {
        return BigNumber(0);
      }

      const client = await LiquidOpsClient();
      const value = await client.getExchangeRate({
        token: token.ticker.toUpperCase(),
        quantity: new Quantity(0n, token.denomination).fromString(quantity).raw,
      });

      return BigNumber(new Quantity(value as bigint, token.baseDenomination).toString());
    },
    select: (data) => data || BigNumber(0),
  });
}
