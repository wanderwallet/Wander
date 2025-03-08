import browser from "webextension-polyfill";
import { useLocation } from "~wallets/router/router.utils";
import SliderMenu from "~components/SliderMenu";
import {
  Button,
  Input,
  Section,
  useInput
} from "@arconnect/components-rebrand";
import Token from "~components/popup/Token";
import styled from "styled-components";
import { useAoTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import { useCallback, useMemo } from "react";

interface Props {
  open: boolean;
  close: () => void;
}

export function ManageAssets({ open, close }: Props) {
  const { navigate } = useLocation();
  const searchInput = useInput();

  const sortFn = useCallback((a: TokenInfo, b: TokenInfo) => {
    if (!a.hidden && b.hidden) return -1;
    if (a.hidden && !b.hidden) return 1;
    return 0;
  }, []);

  // ao Tokens
  const { tokens, changeTokenVisibility } = useAoTokens({
    type: "asset",
    sortFn
  });

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    if (!searchInput.state) return tokens;
    const searchValue = searchInput.state.toLowerCase();
    return tokens.filter((token) => {
      const ticker = token?.Ticker?.toLowerCase();
      const name = token?.Name?.toLowerCase();
      return ticker?.includes(searchValue) || name?.includes(searchValue);
    });
  }, [tokens, searchInput.state]);

  return (
    <SliderMenu
      hasHeader={true}
      title={browser.i18n.getMessage("manage_asset_list")}
      isOpen={open}
      onClose={close}
    >
      <Container>
        <Input
          fullWidth
          variant="search"
          placeholder="Search asset"
          {...searchInput.bindings}
        />
        <TokensList>
          {filteredTokens.map((token) => (
            <Token
              key={token.id}
              ao={true}
              type={"asset"}
              defaultLogo={token?.Logo}
              id={token.id}
              ticker={token.Ticker}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              hidden={token.hidden}
              onHideClick={(hidden) => {
                console.log(token, hidden);
                changeTokenVisibility(token.id, hidden);
              }}
              disableClickEffect
            />
          ))}
        </TokensList>
        <ManageButton
          as={Button}
          fullWidth
          // TODO: The base should be iframe.html for the extension and some domain for the iframe.
          href="#/quick-settings/tokens"
          onClick={(e) => {
            e.preventDefault();
            navigate("/quick-settings/tokens/new");
          }}
        >
          {browser.i18n.getMessage("import_assets")}
        </ManageButton>
      </Container>
    </SliderMenu>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1.5rem;
`;

const TokensList = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
`;

const ManageButton = styled.a.attrs({
  rel: "noopener noreferrer",
  target: "_blank"
})``;
