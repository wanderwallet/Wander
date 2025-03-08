import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import Token from "../Token";
import { useBalanceSortedTokens } from "~tokens/aoTokens/ao";
import { useLocation } from "~wallets/router/router.utils";
import { Settings04 } from "@untitled-ui/icons-react";
import { ManageAssets } from "./ManageAssets";
import { useState } from "react";

export default function Tokens() {
  const { navigate } = useLocation();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const { tokens, prices } = useBalanceSortedTokens({
    type: "asset",
    hidden: false
  });

  function handleTokenClick(tokenId: string) {
    navigate(`/send/transfer/${tokenId}`);
  }

  return (
    <Cointainer>
      {tokens.length === 0 && (
        <NoTokens>{browser.i18n.getMessage("no_assets")}</NoTokens>
      )}
      <TokensList>
        {tokens.map((token) => (
          <Token
            key={token.id}
            divisibility={token.Denomination}
            type={"asset"}
            defaultLogo={token?.Logo}
            id={token.id}
            ticker={token.Ticker}
            fiatPrice={prices[token.id]}
            onClick={() => handleTokenClick(token.id)}
          />
        ))}
      </TokensList>
      <ManageAssetList onClick={() => setOpen(true)}>
        <Settings04
          style={{ color: theme.displayTheme === "light" ? "#666" : "#AAA" }}
          height={20}
          width={20}
        />
        <Text variant="secondary" weight="semibold" size="sm" noMargin>
          {browser.i18n.getMessage("manage_asset_list")}
        </Text>
      </ManageAssetList>
      <ManageAssets open={open} close={() => setOpen(false)} />
    </Cointainer>
  );
}

const Cointainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TokensList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ManageAssetList = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0px;
  gap: 0.5rem;
  cursor: pointer;
`;

const NoTokens = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
