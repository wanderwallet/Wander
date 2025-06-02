import { useActiveTokens } from "./useAvailableTokens";

export function useTokenStatus(ticker: string) {
  const { data: activeTokens } = useActiveTokens();

  const hasToken = activeTokens.some((token) => token.ticker.toLowerCase() === ticker.toLowerCase()) ?? false;

  return {
    hasToken,
  };
}
