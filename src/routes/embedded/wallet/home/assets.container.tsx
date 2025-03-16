import { Box } from "~components/embed/ui";
import { AssetItem } from "./asset-item";
import type { TokenInfoWithBalance } from "~tokens/aoTokens/ao";
export function WalletHomeAssets({
  tokens,
  prices
}: {
  tokens: TokenInfoWithBalance[];
  prices: Record<string, number>;
}) {
  return (
    <Box>
      {tokens.map((token) => (
        <AssetItem
          key={token.id}
          defaultLogo={token.Logo}
          tokenName={token.Name}
          ticker={token.Ticker}
          amount={token.balance}
          fiatPrice={prices[token.id]}
          divisibility={token.Denomination}
        />
      ))}
    </Box>
  );
}
