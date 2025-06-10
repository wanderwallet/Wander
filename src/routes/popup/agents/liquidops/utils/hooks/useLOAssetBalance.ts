import { useQuery } from "@tanstack/react-query";
import { tokenData } from "liquidops";
import { useMemo } from "react";
import { LiquidOpsClient } from "../LiquidOps";
import { Quantity } from "ao-tokens";
import BigNumber from "bignumber.js";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";

export function useLOAssetBalance(ticker: string) {
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
    queryKey: ["assetBalance", token?.address, activeAddress],
    queryFn: async () => {
      if (!token) {
        return BigNumber(0);
      }

      const { client } = await LiquidOpsClient();
      const value = await client.getPosition({
        token: token.ticker.toUpperCase(),
        recipient: activeAddress,
      });

      return BigNumber(new Quantity(value.collateralization, token.baseDenomination).toString());
    },
    select: (data) => data || BigNumber(0),
  });
}
