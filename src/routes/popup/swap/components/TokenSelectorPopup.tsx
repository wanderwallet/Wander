import { useInput, Loading, Input, Text, Spacer } from "@wanderapp/components";
import { useRef, useCallback } from "react";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { useTokensWithPagination } from "../utils/swap.hooks";
import type { TokenInfoWithPoolPartners, TokenSelectorType } from "../utils/swap.types";
import styled from "styled-components";
import browser from "webextension-polyfill";
import Token from "~components/popup/Token";
import { VERIFIED_TOKENS } from "~tokens/aoTokens/ao.constants";

interface TokenSelectorPopupProps {
  tokenSelectorType: TokenSelectorType;
  openTokenSelector: boolean;
  setOpenTokenSelector: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpdateToken: (token: TokenInfoWithPoolPartners) => void;
  filterTokenId?: string;
}

export function TokenSelectorPopup({
  tokenSelectorType,
  openTokenSelector,
  setOpenTokenSelector,
  handleUpdateToken,
  filterTokenId,
}: TokenSelectorPopupProps) {
  return (
    <SliderMenu
      title={browser.i18n.getMessage(tokenSelectorType === "send" ? "you_send" : "you_receive")}
      height="90vh"
      isOpen={openTokenSelector}
      onClose={() => setOpenTokenSelector(false)}
      scrollable={false}>
      <TokenSelectorScreen
        onClose={() => setOpenTokenSelector(false)}
        updateToken={handleUpdateToken}
        tokenSelectorType={tokenSelectorType}
        filterTokenId={filterTokenId}
      />
    </SliderMenu>
  );
}

interface TokenSelectorScreenProps {
  onClose: () => void;
  updateToken: (token: TokenInfo) => void;
  tokenSelectorType: TokenSelectorType;
  filterTokenId?: string;
}

const TokenSelectorScreen = ({ onClose, updateToken, tokenSelectorType, filterTokenId }: TokenSelectorScreenProps) => {
  const searchInput = useInput();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { tokens, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useTokensWithPagination(
    20,
    searchInput.state,
    tokenSelectorType,
    filterTokenId,
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && hasNextPage && !searchInput.state && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, fetchNextPage, searchInput.state, isFetchingNextPage],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      searchInput.bindings.onChange(e);
    },
    [searchInput.bindings],
  );

  const isInitialLoading = isLoading && tokens.length === 0;

  return (
    <SelectorWrapper>
      <div>
        <Input
          placeholder={browser.i18n.getMessage("search_token")}
          fullWidth
          variant="search"
          sizeVariant="small"
          value={searchInput.state}
          onChange={handleSearchChange}
        />
      </div>
      <TokenListContainer ref={scrollContainerRef} onScroll={handleScroll}>
        <Spacer y={0.15} />
        <Flex direction="column" gap={20}>
          {isInitialLoading ? (
            <Flex justify="center" align="center" style={{ height: "200px" }}>
              <Loading style={{ height: 24, width: 24 }} />
            </Flex>
          ) : (
            <>
              {tokens.map((token, index) => (
                <Token
                  key={token.processId}
                  type={"asset"}
                  defaultLogo={token?.Logo}
                  id={token.processId}
                  showId={true}
                  ticker={token.Ticker}
                  denomination={token.Denomination}
                  onClick={() => {
                    updateToken(token);
                    onClose();
                  }}
                  addressOverFiat
                  addressSize="sm"
                  fetchMissingLogo
                  isVerified={VERIFIED_TOKENS.has(token.processId)}
                  balanceTooltipPosition={index === 0 ? "left" : "topEnd"}
                />
              ))}
              {searchInput.state && tokens.length === 0 && (
                <Flex justify="center" align="center" style={{ height: "100px" }}>
                  <Text variant="secondary" size="sm">
                    {browser.i18n.getMessage("no_tokens_found")}
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Flex>
        <Spacer y={1.5} />
      </TokenListContainer>
    </SelectorWrapper>
  );
};

const SelectorWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  flex: 1;
  gap: 16px;
`;

const TokenListContainer = styled.div`
  overflow-y: auto;
  margin: 0 -24px;
  padding: 0 24px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.secondaryText};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.primaryText};
  }
`;
