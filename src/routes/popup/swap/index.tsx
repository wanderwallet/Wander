import { Text, Input, useInput, Section, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ArrowDown, ClockRewind } from "@untitled-ui/icons-react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useMemo, useState } from "react";
import SliderMenu from "~components/SliderMenu";
import { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import { SwapInput } from "./components/SwapInput";
import { defaultTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import { DisclosureButton, DisclosureContent } from "~routes/popup/swap/components/Disclosure";
import { SlippageInputButton } from "./components/SlippageInputButton";
import Token from "~components/popup/Token";

const usdaToken = defaultTokens[4];
const wndrToken = defaultTokens[3];

export function SwapView() {
  const theme = useTheme();
  const [isReversed, setIsReversed] = useState(false);
  const [openTokenSelector, setOpenTokenSelector] = useState(false);
  const [amount, setAmount] = useState("");
  const [sendToken, setSendToken] = useState<TokenInfo>(usdaToken);
  const [receiveToken, setReceiveToken] = useState<TokenInfo>(wndrToken);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedSlippage, setSelectedSlippage] = useState(0.5);
  const [tokenSelectorType, setTokenSelectorType] = useState<"send" | "receive">("send");

  function handleSwitch() {
    setIsReversed((prev) => !prev);
    setAmount("");
  }

  function handleUpdateToken(token: TokenInfo) {
    if (tokenSelectorType === "send") {
      setSendToken(token);
    } else {
      setReceiveToken(token);
    }
  }

  return (
    <>
      <HeadV2 title="Swap" />
      <Wrapper>
        <WrapperContent>
          <Flex direction="column" gap={8} style={{ position: "relative" }}>
            <SwapInput
              type="send"
              amount={amount}
              onAmountChange={setAmount}
              token={isReversed ? receiveToken : sendToken}
              onTokenSwitcherClick={() => {
                setTokenSelectorType("send");
                setOpenTokenSelector(true);
              }}
            />
            <Switch onClick={handleSwitch}>
              <ArrowDown style={{ height: 24, width: 24 }} color={theme.primaryText} />
            </Switch>
            <SwapInput
              type="receive"
              amount={""}
              onAmountChange={() => {}}
              onTokenSwitcherClick={() => {
                setTokenSelectorType("receive");
                setOpenTokenSelector(true);
              }}
              token={isReversed ? sendToken : receiveToken}
            />
          </Flex>
          <Flex direction="column" gap={8}>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Rate
              </Text>
              <Text size="sm" weight="medium" noMargin>
                1 qAR ≈ 11.8758 AGENT
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Fees
              </Text>
              <Text size="sm" weight="medium" noMargin>
                0.01 AR
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Price Impact
              </Text>
              <Text size="sm" weight="medium" noMargin color={theme.secondaryText}>
                0.5%
              </Text>
            </Flex>
          </Flex>

          <DisclosureButton
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            expandedMessageName="advanced"
            collapsedMessageName="advanced"
            textVariant="tertiary"
          />

          <DisclosureContent expanded={showAdvanced}>
            <SlippageInputButton
              type="swap"
              selectedSlippage={selectedSlippage}
              setSelectedSlippage={setSelectedSlippage}
            />
          </DisclosureContent>
        </WrapperContent>

        <Flex gap={8}>
          <Button style={{ flex: 1 }} disabled={!amount} onClick={() => {}} fullWidth>
            {browser.i18n.getMessage("enter_amount")}
          </Button>
          <Button width="72px" variant="secondary" icon={<ClockRewind height={24} width={24} />} onClick={() => {}} />
        </Flex>
      </Wrapper>

      <SliderMenu
        title={browser.i18n.getMessage(tokenSelectorType === "send" ? "you_send" : "you_receive")}
        height="90vh"
        isOpen={openTokenSelector}
        onClose={() => setOpenTokenSelector(false)}>
        <CurrencySelectorScreen
          onClose={() => setOpenTokenSelector(false)}
          updateToken={handleUpdateToken}
          tokens={[wndrToken, usdaToken]}
        />
      </SliderMenu>
    </>
  );
}

const CurrencySelectorScreen = ({
  onClose,
  tokens,
  updateToken,
}: {
  onClose: () => void;
  tokens: TokenInfo[];
  updateToken: (token: TokenInfo) => void;
}) => {
  const searchInput = useInput();

  const filteredTokens = useMemo(() => {
    if (!searchInput.state) {
      return tokens;
    }
    return tokens.filter((currency) => {
      const name = currency.Name?.toLowerCase() || "";
      const symbol = currency.Ticker?.toLowerCase() || "";
      const searchLower = searchInput.state.toLowerCase();
      return name.includes(searchLower) || symbol.includes(searchLower);
    });
  }, [tokens, searchInput.state]);

  return (
    <SelectorWrapper>
      <div style={{ paddingBottom: "18px" }}>
        <Input placeholder="Search token" fullWidth variant="search" sizeVariant="small" {...searchInput.bindings} />
      </div>
      <Flex direction="column" gap={20}>
        {filteredTokens.map((token) => {
          return (
            <Token
              key={token.processId}
              type={"asset"}
              defaultLogo={token?.Logo}
              id={token.processId}
              showId={true}
              ticker={token.Ticker}
              divisibility={token.Denomination}
              onClick={() => {}}
              addressOverFiat
              addressSize="sm"
            />
          );
        })}
      </Flex>
    </SelectorWrapper>
  );
};

const Wrapper = styled(Section).attrs({ showPaddingVertical: false })`
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  gap: 24px;
`;

const WrapperContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const SelectorWrapper = styled.div`
  width: 100%;
`;

const Switch = styled(Button).attrs({
  variant: "secondary",
  width: 40,
})`
  padding: 8px;
  border: 4px solid ${(props) => props.theme.surfaceDefault} !important;
  border-radius: 8px;
  margin: auto;
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  z-index: 100;
`;
