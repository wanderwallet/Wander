import { tokenData } from "liquidops";
import { useLOSupplyAPYs } from "./useLOSupplyAPY";
import { useMemo } from "react";

export function useAPYOrder() {
  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const queries = useLOSupplyAPYs(activeTokens.map((token) => token.ticker));

  return useMemo(() => {
    const apyEntries = activeTokens.map((token, index) => [token.ticker, queries[index].data || 0]);
    return Object.fromEntries(apyEntries);
  }, [queries, activeTokens]);
}
