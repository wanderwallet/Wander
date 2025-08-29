import { useMemo } from "react";
import { useActiveTokens } from "./useAvailableTokens";

export function useTokenStatus(ticker: string) {
  const { data: activeTokens } = useActiveTokens();

  const hasToken = useMemo(
    () => activeTokens?.some((token) => token.ticker.toLowerCase() === ticker.toLowerCase()) ?? false,
    [activeTokens],
  );

  return {
    hasToken,
  };
}
