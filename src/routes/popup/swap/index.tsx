import { Text, Section, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ArrowDown, ClockRewind } from "@untitled-ui/icons-react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useState } from "react";
import { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import { SwapInput } from "./components/SwapInput";
import { defaultTokens, type TokenInfo } from "~tokens/aoTokens/ao";
import { DisclosureButton, DisclosureContent } from "~routes/popup/swap/components/Disclosure";
import { SlippageInputButton } from "./components/SlippageInputButton";
import { useSwapSlippage } from "./utils/swap.hooks";
import type { TokenSelectorType } from "./utils/swap.types";
import { TokenSelectorPopup } from "./components/TokenSelectorPopup";

const usdaToken = defaultTokens[4];
const wndrToken = defaultTokens[3];

export function SwapView() {
  const theme = useTheme();
  const [selectedSlippage, setSelectedSlippage] = useSwapSlippage();
  const [isReversed, setIsReversed] = useState(false);
  const [openTokenSelector, setOpenTokenSelector] = useState(false);
  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [sendToken, setSendToken] = useState<TokenInfo>(usdaToken);
  const [receiveToken, setReceiveToken] = useState<TokenInfo>(wndrToken);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<TokenSelectorType>("send");

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
              amount={receiveAmount}
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
                Slippage
              </Text>
              <Flex gap={4} align="center" justify="center">
                <Text size="sm" weight="medium" noMargin color={theme.secondaryText}>
                  {selectedSlippage}%{" "}
                </Text>
                {selectedSlippage === 0.5 && (
                  <AutoTag>
                    <Text size="2xs" weight="medium" style={{ color: "#EEE" }} noMargin>
                      Auto
                    </Text>
                  </AutoTag>
                )}
              </Flex>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Network Fee
              </Text>
              <Text size="sm" weight="medium" noMargin>
                0.01 wAR
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Wander Fee
              </Text>
              <Text size="sm" weight="medium" noMargin>
                0.95 wAR
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
            {amount ? browser.i18n.getMessage("review") : browser.i18n.getMessage("enter_amount")}
          </Button>
          <Button width="72px" variant="secondary" icon={<ClockRewind height={24} width={24} />} onClick={() => {}} />
        </Flex>
      </Wrapper>

      <TokenSelectorPopup
        tokenSelectorType={tokenSelectorType}
        openTokenSelector={openTokenSelector}
        setOpenTokenSelector={setOpenTokenSelector}
        handleUpdateToken={handleUpdateToken}
      />
    </>
  );
}

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

const AutoTag = styled.div`
  display: flex;
  height: 18px;
  padding: 2px 4px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 4px;
  background: #403785;
  box-sizing: border-box;
`;
