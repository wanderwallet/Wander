import type { TokenInfo } from "~tokens/aoTokens/ao";
import { retryWithDelay } from "~utils/promises/retry";

const FAIR_LAUNCH_TOKENS_URL = "https://cdn.jsdelivr.net/gh/wanderwallet/wander-data@main/tokens/flp-tokens.min.json";

export async function getFairLaunchTokens(): Promise<TokenInfo[]> {
  try {
    const response = await retryWithDelay(() => fetch(FAIR_LAUNCH_TOKENS_URL, { cache: "no-store" }));
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.status}`);
    }

    const flpTokens = await response.json();

    return flpTokens.map(({ Name, Ticker, Denomination, Logo, Id: processId }) => ({
      Name,
      Ticker,
      Denomination,
      Logo,
      processId,
      type: "asset",
    }));
  } catch {
    return [];
  }
}
