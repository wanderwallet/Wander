import { Text, Section, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ArrowDown, ClockRewind } from "@untitled-ui/icons-react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useMemo, useState } from "react";
import { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import { SwapInput } from "./components/SwapInput";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import { DisclosureButton, DisclosureContent } from "~routes/popup/swap/components/Disclosure";
import { SlippageInputButton } from "./components/SlippageInputButton";
import { useARNetworkFee, usePoolForTokenPair, useSwapSlippage } from "./utils/swap.hooks";
import type { SwapData, TokenSelectorType } from "./utils/swap.types";
import { TokenSelectorPopup } from "./components/TokenSelectorPopup";
import BigNumber from "bignumber.js";
import { useDefiFeeDetails } from "~utils/tier/hooks";
import { useTokenBalance } from "~tokens/hooks";
import { useActiveAddress } from "~wallets/hooks";
import { TempTransactionStorage } from "~utils/storage";
import { useLocation } from "~wallets/router/router.utils";
import { AutoTag } from "./components/AutoTag";
import { WanderFeeTag } from "./components/WanderFeeTag";
import {
  AR_PROCESS_ID,
  AR_TOKEN_INFO,
  defaultTokens,
  WAR_PROCESS_ID,
  WAR_TOKEN_INFO,
} from "~tokens/aoTokens/ao.constants";
import { getErrorMessage, validateAmount } from "../send/amount";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";

// TODO: Update this after testing
const usdaToken = AR_TOKEN_INFO;
const wndrToken = WAR_TOKEN_INFO;

const wARToken = defaultTokens[5];

export function SwapView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const activeAddress = useActiveAddress();
  const [slippage, setSlippage] = useSwapSlippage();
  const defiFeeDetails = useDefiFeeDetails();
  const [openTokenSelector, setOpenTokenSelector] = useState(false);
  const [valueIn, setValueIn] = useState("");
  const [sendToken, setSendToken] = useState<TokenInfo>(usdaToken);
  const [receiveToken, setReceiveToken] = useState<TokenInfo>(wndrToken);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<TokenSelectorType>("send");
  const { networkFee, isLoading: isNetworkFeeLoading } = useARNetworkFee({ tokenID: sendToken.processId });

  const { data: balanceIn = "0", isLoading: balanceInLoading } = useTokenBalance(sendToken, activeAddress);
  const { data: balanceOut = "0", isLoading: balanceOutLoading } = useTokenBalance(receiveToken, activeAddress);

  const amountIn = useMemo(() => {
    if (!valueIn || !sendToken) return "";
    return BigNumber(valueIn).shiftedBy(sendToken.Denomination).toFixed();
  }, [valueIn, sendToken]);

  const errorMessage = useMemo(() => {
    if (!valueIn || !balanceIn || !sendToken || !receiveToken) return "";

    const fee = sendToken.processId === AR_PROCESS_ID && receiveToken.processId === WAR_PROCESS_ID ? networkFee : "0";
    const state = validateAmount(valueIn, balanceIn, fee, "token", 1);
    return getErrorMessage(state);
  }, [valueIn, balanceIn, sendToken, receiveToken, networkFee]);

  const {
    selectedPoolInfo,
    isLoading,
    error: poolError,
  } = usePoolForTokenPair({
    tokenIn: sendToken?.processId,
    tokenOut: receiveToken?.processId,
    slippage: slippage,
    amountIn: errorMessage ? "" : amountIn,
  });

  const valueOut = useMemo(() => {
    if (!valueIn || !selectedPoolInfo?.quoteOutput?.amountOut || !receiveToken) return "";
    return BigNumber(selectedPoolInfo?.quoteOutput?.amountOut || "0")
      .shiftedBy(-receiveToken.Denomination)
      .toFixed();
  }, [selectedPoolInfo, receiveToken, valueIn]);

  const rate = useMemo(() => {
    if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken) return "--";

    const valueIn = BigNumber(selectedPoolInfo.quoteOutput.amountInWithoutFee || "0").shiftedBy(
      -sendToken.Denomination,
    );
    const valueOut = BigNumber(selectedPoolInfo.quoteOutput.amountOut || "0").shiftedBy(-receiveToken.Denomination);

    if (valueIn.isZero()) return "--";

    const valueOutForUnitValueIn = valueOut.dividedBy(valueIn);
    return `1 ${sendToken.Ticker} ≈ ${valueOutForUnitValueIn.toFixed(8)} ${receiveToken.Ticker}`;
  }, [selectedPoolInfo, sendToken, receiveToken]);

  const providerNetworkFee = useMemo(() => {
    if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken) return "--";

    const tokenInFee = BigNumber(selectedPoolInfo.quoteOutput.totalTokenInFeeQuantity || "0");
    const tokenOutFee = BigNumber(selectedPoolInfo.quoteOutput.totalTokenOutFeeQuantity || "0");

    const formatFee = (amount: BigNumber, token: TokenInfo) =>
      `${amount.shiftedBy(-token.Denomination).toFixed(8)} ${token.Ticker}`;

    if (tokenInFee.isZero() && tokenOutFee.isZero()) {
      return `0 ${sendToken.Ticker}`;
    }

    const fees = [];
    if (!tokenInFee.isZero()) {
      fees.push(formatFee(tokenInFee, sendToken));
    }

    if (!tokenOutFee.isZero()) {
      fees.push(formatFee(tokenOutFee, receiveToken));
    }

    return fees.join(" + ");
  }, [selectedPoolInfo, sendToken, receiveToken]);

  const wanderFee = useMemo(() => {
    if (!valueIn || !defiFeeDetails) return { originalFee: "--", finalFee: "--", hasChanged: false };
    const originalFee = BigNumber(valueIn).multipliedBy(defiFeeDetails.originalFeePercent).dividedBy(100);
    const finalFee = BigNumber(valueIn).multipliedBy(defiFeeDetails.finalFeePercent).dividedBy(100);

    return {
      hasChanged: defiFeeDetails.feeHasChanged,
      originalFee: `${originalFee.toFixed(8)}`,
      finalFee: `${finalFee.toFixed(8)} ${sendToken.Ticker}`,
    };
  }, [selectedPoolInfo, sendToken]);

  function handleSwitch() {
    const tempSendToken = sendToken;
    const tempReceiveToken = receiveToken;
    setSendToken(tempReceiveToken);
    setReceiveToken(tempSendToken);
    setValueIn("");
  }

  function handleUpdateToken(token: TokenInfo) {
    if (tokenSelectorType === "send") {
      setSendToken(token);
      if (token.processId === AR_PROCESS_ID) {
        setReceiveToken(wARToken);
      }
    } else {
      setReceiveToken(token);
    }
    setValueIn("");
  }

  async function handleSwap() {
    if (!selectedPoolInfo) return;

    const swapData = {
      selectedPoolInfo,
      slippage,
      sendToken,
      receiveToken,
      wanderFee,
      amountIn,
    } satisfies SwapData;

    await TempTransactionStorage.set("swap-data", swapData);

    navigate("/swap/review");
  }

  useAsyncEffect(async () => {
    const swapData = await TempTransactionStorage.get<SwapData>("swap-data");
    if (swapData) {
      const sendToken = swapData.sendToken;
      const receiveToken = swapData.receiveToken;
      const amountIn = swapData.amountIn;
      const slippage = swapData.slippage;
      const valueIn = BigNumber(amountIn).shiftedBy(-sendToken.Denomination).toFixed();

      setSendToken(sendToken);
      setReceiveToken(receiveToken);
      setValueIn(valueIn);
      setSlippage(slippage);
    }
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("swap")} />
      <Wrapper>
        <WrapperContent>
          <Flex direction="column" gap={8} style={{ position: "relative" }}>
            <SwapInput
              type="send"
              status={errorMessage ? "error" : "default"}
              value={valueIn}
              balance={balanceIn}
              balanceLoading={balanceInLoading}
              onValueChange={setValueIn}
              token={sendToken}
              onTokenSwitcherClick={() => {
                setTokenSelectorType("send");
                setOpenTokenSelector(true);
              }}
              onMaxClick={() => {
                if (sendToken.processId === AR_PROCESS_ID) {
                  setValueIn(BigNumber(balanceIn).minus(networkFee).toFixed());
                } else {
                  setValueIn(balanceIn);
                }
              }}
            />
            <Switch onClick={handleSwitch} isError={!!errorMessage}>
              <ArrowDown style={{ height: 24, width: 24 }} color={theme.primaryText} />
            </Switch>
            <SwapInput
              type="receive"
              value={valueOut}
              balance={balanceOut}
              balanceLoading={balanceOutLoading}
              onValueChange={() => {}}
              onTokenSwitcherClick={() => {
                setTokenSelectorType("receive");
                setOpenTokenSelector(true);
              }}
              token={receiveToken}
            />
            {(errorMessage || poolError) && <ErrorMsg>{errorMessage || poolError}</ErrorMsg>}
          </Flex>
          <Flex direction="column" gap={8}>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Rate
              </Text>
              <Text size="sm" weight="medium" noMargin>
                {rate}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Slippage
              </Text>
              <Flex gap={4} align="center" justify="center">
                <Text variant="secondary" size="sm" weight="medium" noMargin>
                  {slippage}%{" "}
                </Text>
                <AutoTag slippage={slippage} />
              </Flex>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Network Fee
              </Text>
              <Text size="sm" weight="medium" noMargin>
                {providerNetworkFee}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                Wander Fee
              </Text>
              <Flex justify="center" align="center" gap={4}>
                {wanderFee.hasChanged && <CrossedOutText>{wanderFee.originalFee}</CrossedOutText>}
                <Text size="sm" weight="medium" style={{ color: "#9787FF" }} noMargin>
                  {wanderFee.finalFee}
                </Text>
                {wanderFee.finalFee !== "--" && <WanderFeeTag />}
              </Flex>
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
            <SlippageInputButton type="swap" slippage={slippage} setSlippage={setSlippage} />
          </DisclosureContent>
        </WrapperContent>

        <Flex gap={8}>
          <Button
            style={{ flex: 1 }}
            disabled={!valueIn || isLoading || isNetworkFeeLoading || !!errorMessage || !!poolError}
            loading={isLoading}
            onClick={handleSwap}
            fullWidth>
            {valueIn ? browser.i18n.getMessage("review") : browser.i18n.getMessage("enter_amount")}
          </Button>
          <Button width="72px" variant="secondary" icon={<ClockRewind height={24} width={24} />} onClick={() => {}} />
        </Flex>
      </Wrapper>

      <TokenSelectorPopup
        tokenSelectorType={tokenSelectorType}
        openTokenSelector={openTokenSelector}
        setOpenTokenSelector={setOpenTokenSelector}
        handleUpdateToken={handleUpdateToken}
        filterTokenId={sendToken?.processId}
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
})<{ isError: boolean }>`
  padding: 8px;
  border: 4px solid ${(props) => props.theme.surfaceDefault} !important;
  border-radius: 8px;
  margin: auto;
  position: absolute;
  left: 50%;
  top: ${(props) => (props.isError ? "46%" : "50%")};
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  z-index: 100;
`;

const CrossedOutText = styled(Text).attrs({
  size: "sm",
  weight: "medium",
  noMargin: true,
})`
  color: #75747d;
  text-align: center;
  text-decoration-line: line-through;
`;

export const ErrorMsg = styled(Text).attrs({
  size: "xs",
  weight: "medium",
  noMargin: true,
})`
  color: ${(props) => props.theme.fail};
`;
