import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useRoute } from "wouter";
import { useEffect, useMemo } from "react";
import type { TokenType } from "~tokens/token";
import { Reorder } from "framer-motion";
import TokenListItem from "./list/TokenListItem";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { Button, Spacer } from "@arconnect/components-rebrand";
import { type TokenInfoWithBalance } from "~tokens/aoTokens/ao";
import { useLocation } from "~wallets/router/router.utils";

export function TokensDashboardView() {
  const { navigate } = useLocation();
  // TODO: Replace with useParams:
  const [matches, params] = useRoute<{ id?: string }>("/tokens/:id?");

  // tokens
  const [aoTokens] = useStorage<TokenInfoWithBalance[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const enhancedAoTokens = useMemo(() => {
    return aoTokens.map((token) => ({
      id: token.processId,
      defaultLogo: token.Logo,
      balance: "0",
      ticker: token.Ticker,
      type: "asset" as TokenType,
      name: token.Name
    }));
  }, [aoTokens]);

  // active subsetting val
  const activeTokenSetting = useMemo(
    () => (params?.id ? params.id : undefined),
    [params]
  );

  useEffect(() => {
    if (activeTokenSetting === "new" || !matches) {
      return;
    }

    // return if there is a wallet present in params
    if (
      activeTokenSetting &&
      enhancedAoTokens.some((t) => t.id === activeTokenSetting)
    ) {
      return;
    }

    if (enhancedAoTokens.length > 0) {
      navigate(`/tokens/${enhancedAoTokens[0].id}`);
    }
  }, [enhancedAoTokens, activeTokenSetting, matches]);

  const addToken = () => {
    navigate("/tokens/new");
  };

  const handleTokenClick = (token: {
    id: any;
    defaultLogo?: string;
    balance?: string;
    ticker?: string;
    type?: TokenType;
    name?: string;
  }) => {
    navigate(`/tokens/${token.id}`);
  };

  return (
    <Wrapper>
      <div style={{ overflowY: "auto" }}>
        <Reorder.Group
          as="div"
          axis="y"
          onReorder={() => {}}
          values={aoTokens}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {enhancedAoTokens.map((token) => (
            <div onClick={() => handleTokenClick(token)} key={token.id}>
              <TokenListItem
                token={token}
                active={activeTokenSetting === token.id}
                key={token.id}
              />
            </div>
          ))}
        </Reorder.Group>
        <Spacer y={1} />
      </div>
      <Button fullWidth onClick={addToken}>
        {browser.i18n.getMessage("import_token")}
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;
