import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
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
      instance: ExtensionStorage
    },
    []
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
          name: token.Name
        };

        if (enhancedToken.type === "collectible") {
          acc.collectibles.push(enhancedToken);
        } else {
          acc.assets.push(enhancedToken);
        }
        return acc;
      },
      { assets: [], collectibles: [] }
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
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.ticker.toLowerCase().includes(query.toLowerCase())
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
      <HeadV2
        title={browser.i18n.getMessage("setting_tokens")}
        back={() => navigate("/quick-settings")}
      />
      <Wrapper>
        <div>
          <SearchInput
            small
            placeholder={browser.i18n.getMessage("search_tokens")}
            {...searchInput.bindings}
          />
          <Spacer y={1} />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {assets.length > 0 && (
              <>
                <Label>{browser.i18n.getMessage("assets")}</Label>
                {assets.filter(filterSearchResults).map((token) => (
                  <div onClick={() => handleTokenClick(token)} key={token.id}>
                    <TokenListItem
                      token={token}
                      active={false}
                      key={token.id}
                    />
                  </div>
                ))}
              </>
            )}
            {collectibles.length > 0 && (
              <>
                <Label>{browser.i18n.getMessage("collectibles")}</Label>
                {collectibles.filter(filterSearchResults).map((token) => (
                  <div onClick={() => handleTokenClick(token)} key={token.id}>
                    <TokenListItem
                      token={token}
                      active={false}
                      key={token.id}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
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
  height: calc(100vh - 70px);
`;

const Label = styled.p`
  font-size: 1rem;
  font-weight: 400;
  color: ${(props) => props.theme.primaryText};
  margin: 0;
`;

export const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  background-color: rgb(${(props) => props.theme.background});
`;
