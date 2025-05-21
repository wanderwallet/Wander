import { useState } from "react";
import { Button } from "~components/embed/ui";
import { AssetItem } from "./asset-item";
import type { TokenInfoWithBalance } from "~tokens/aoTokens/ao";

export function WalletHomeAssets({
  activeWalletAddress,
  tokens,
  prices,
}: {
  activeWalletAddress: string;
  tokens: TokenInfoWithBalance[];
  prices: Record<string, number>;
}) {
  const [showAllTokens, setShowAllTokens] = useState(false);

  const hasMoreTokens = tokens.length > 3;

  const displayedTokens = showAllTokens ? tokens : tokens.slice(0, 3);

  const handleLoadMore = () => {
    setShowAllTokens(true);
  };

  const handleShowLess = () => {
    setShowAllTokens(false);
  };

  return (
    <>
      {displayedTokens.map((token) => (
        <AssetItem
          activeWalletAddress={activeWalletAddress}
          key={token.id}
          id={token.id}
          defaultLogo={token.Logo}
          tokenName={token.Name}
          ticker={token.Ticker}
          amount={token.balance}
          fiatPrice={prices[token.id]}
          divisibility={token.Denomination}
        />
      ))}

      {hasMoreTokens && (
        <Button
          variant="secondary"
          hasBorder={false}
          style={{
            color: "var(--color-copyable-text-value)",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: "12px 0",
            textAlign: "center",
          }}
          onClick={showAllTokens ? handleShowLess : handleLoadMore}>
          {showAllTokens ? "Show less" : `View More (${tokens.length - 3})`}
        </Button>
      )}
    </>
  );
}
