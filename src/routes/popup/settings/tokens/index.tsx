import { PersistentStorage, useStorage } from "~utils/storage";
import { useMemo } from "react";
import type { Token, TokenType } from "~tokens/token";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { ButtonV2, Spacer, useInput } from "@arconnect/components";
import { type TokenInfoWithBalance } from "~tokens/aoTokens/ao";
import HeadV2 from "~components/popup/HeadV2";
import SearchInput from "~components/dashboard/SearchInput";
import { useLocation } from "~wallets/router/router.utils";
import { TokenListItem } from "~components/popup/list/TokenListItem";

export function TokensSettingsView() {
  const { navigate } = useLocation();

  const [aoTokens] = useStorage<TokenInfoWithBalance[]>(
    {
      key: "ao_tokens",
      instance: PersistentStorage,
    },
    [],
  );

  const { assets, collectibles } = useMemo(() => {
    const processed = aoTokens.reduce(
      (acc, token) => {
        const enhancedToken = {
          id: token.processId,
          defaultLogo: token.Logo,
          balance: "0",
          ticker: token.Ticker,
          type: token.type || "asset",
          name: token.Name,
        };

        if (enhancedToken.type === "collectible") {
          acc.collectibles.push(enhancedToken);
        } else {
          acc.assets.push(enhancedToken);
        }
        return acc;
      },
      { assets: [], collectibles: [] },
    );

    return processed;
  }, [aoTokens]);

  // search
  const searchInput = useInput();

  // search filter function
  function filterSearchResults(token: Token) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      token.name.toLowerCase().includes(query.toLowerCase()) || token.ticker.toLowerCase().includes(query.toLowerCase())
    );
  }

  const addToken = () => {
    navigate("/quick-settings/tokens/new");
  };

  const handleTokenClick = (token: {
    id: any;
    defaultLogo?: string;
    balance?: string;
    ticker?: string;
    type?: TokenType;
    name?: string;
  }) => {
    navigate(`/quick-settings/tokens/${token.id}`);
  };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_tokens")} back={() => navigate("/quick-settings")} />
      <Wrapper>
        <div>
          <SearchInput
            sizeVariant="small"
            placeholder={browser.i18n.getMessage("search_tokens")}
            {...searchInput.bindings}
          />

          <Spacer y={1} />

          <TokensList>
            {assets.length > 0 && (
              <>
                <Label style={{ marginBottom: "1rem" }}>{browser.i18n.getMessage("assets")}</Label>
                {assets.filter(filterSearchResults).map((token) => (
                  <TokenListItem key={token.id} token={token} active={false} onClick={() => handleTokenClick(token)} />
                ))}
              </>
            )}

            {collectibles.length > 0 && (
              <>
                <Label style={{ margin: "1rem 0" }}>{browser.i18n.getMessage("collectibles")}</Label>
                {collectibles.filter(filterSearchResults).map((token) => (
                  <TokenListItem key={token.id} token={token} active={false} onClick={() => handleTokenClick(token)} />
                ))}
              </>
            )}
          </TokensList>
        </div>

        <ActionBar>
          <ButtonV2 fullWidth onClick={addToken}>
            {browser.i18n.getMessage("import_token")}
          </ButtonV2>
        </ActionBar>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 100px);
`;

const Label = styled.p`
  font-size: 1rem;
  font-weight: 400;
  color: ${(props) => props.theme.primaryText};
  margin: 0;
`;

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
`;

const TokensList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 65vh;
`;
