import { Text, Section, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ArrowDown, ClockRewind } from "@untitled-ui/icons-react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import { SwapInput } from "./components/SwapInput";
import { fetchTokenByProcessId, type TokenInfo } from "~tokens/aoTokens/ao";
import { DisclosureButton, DisclosureContent } from "~routes/popup/swap/components/Disclosure";
import { SlippageInputButton } from "./components/SlippageInputButton";
import {
  useARNetworkFee,
  useIsSwapGated,
  usePoolForTokenPair,
  useProviderNetworkFee,
  useSwapRate,
  useSwapReceiveToken,
  useSwapSendToken,
  useSwapSlippage,
  useWanderFee,
} from "./utils/swap.hooks";
import type { SwapData, TokenInfoWithPoolPartners, TokenSelectorType } from "./utils/swap.types";
import { TokenSelectorPopup } from "./components/TokenSelectorPopup";
import { useDefiFeeDetails } from "~utils/tier/hooks";
import { useTokenBalance } from "~tokens/hooks";
import { useActiveAddress, useDebounce } from "~wallets/hooks";
import { TempTransactionStorage } from "~utils/storage";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { AutoTag } from "./components/AutoTag";
import { WanderFeeTag } from "./components/WanderFeeTag";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { getErrorMessage, validateAmount } from "../send/amount";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { fromTokenBaseUnits, getPriceImpactColor, toFixed, toTokenBaseUnits } from "./utils/swap.utils";
import { PageType, trackPage } from "~utils/analytics";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { ErrorIcon } from "./components/ErrorIcon";
import BigNumber from "bignumber.js";

export function SwapView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const { loadSwapData } = useSearchParams<{ loadSwapData: string }>();
  const activeAddress = useActiveAddress();
  const isSwapGated = useIsSwapGated();
  const [slippage, setSlippage] = useSwapSlippage();
  const defiFeeDetails = useDefiFeeDetails();
  const [openTokenSelector, setOpenTokenSelector] = useState(false);
  const [valueIn, setValueIn] = useState("");
  const [sendToken, setSendToken] = useSwapSendToken();
  const [receiveToken, setReceiveToken] = useSwapReceiveToken();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<TokenSelectorType>("send");
  const {
    networkFee,
    networkFeeValue,
    isLoading: isNetworkFeeLoading,
  } = useARNetworkFee({
    tokenIn: sendToken.processId,
    tokenOut: receiveToken.processId,
    doubleFee: +defiFeeDetails?.finalFeePercent > 0,
  });
  const debouncedValueIn = useDebounce(valueIn, 300);

  const { data: balanceIn = "0", isLoading: balanceInLoading } = useTokenBalance(sendToken, activeAddress);
  const { data: balanceOut = "0", isLoading: balanceOutLoading } = useTokenBalance(receiveToken, activeAddress);

  const amountIn = useMemo(() => {
    if (!debouncedValueIn || !sendToken) return "";
    return toTokenBaseUnits(debouncedValueIn, sendToken.Denomination);
  }, [debouncedValueIn, sendToken]);

  const maxValueIn = useMemo(
    () => (sendToken.processId === AR_PROCESS_ID ? BigNumber(balanceIn).minus(networkFeeValue).toFixed() : balanceIn),
    [balanceIn, networkFeeValue, sendToken.processId],
  );

  const errorMessage = useMemo(() => {
    if (!debouncedValueIn || !balanceIn || !sendToken || !receiveToken || !networkFeeValue) return "";

    const state = validateAmount(debouncedValueIn, balanceIn, networkFeeValue, "token", 1);
    return getErrorMessage(state);
  }, [debouncedValueIn, balanceIn, sendToken, receiveToken, networkFeeValue]);

  const {
    selectedPoolInfo,
    isLoading,
    error: poolError,
  } = usePoolForTokenPair({
    tokenIn: sendToken?.processId,
    tokenOut: receiveToken?.processId,
    slippage: slippage,
    amountIn: errorMessage ? "" : amountIn,
    wanderFeePercent: +defiFeeDetails.finalFeePercent,
  });

  const valueOut = useMemo(() => {
    const amountOut = selectedPoolInfo?.quoteOutput?.amountOut;
    if (!debouncedValueIn || !amountOut || !receiveToken) return "";
    return fromTokenBaseUnits(amountOut, receiveToken.Denomination);
  }, [selectedPoolInfo, receiveToken, debouncedValueIn]);

  const rate = useSwapRate({
    selectedPoolInfo,
    sendToken,
    receiveToken,
    amountIn,
  });

  const providerNetworkFee = useProviderNetworkFee({
    selectedPoolInfo,
    sendToken,
    receiveToken,
    networkFee,
  });

  const wanderFee = useWanderFee({
    valueIn: debouncedValueIn,
    defiFeeDetails,
    token: sendToken,
  });

  function handleSwitch() {
    const tempSendToken = sendToken;
    const tempReceiveToken = receiveToken;
    setSendToken(tempReceiveToken);
    setReceiveToken(tempSendToken);
    setValueIn("");
  }

  function handleUpdateToken(token: TokenInfoWithPoolPartners) {
    const finalToken: TokenInfo = {
      Name: token.Name,
      Denomination: token.Denomination,
      Ticker: token.Ticker,
      Logo: token.Logo,
      processId: token.processId,
    };
    if (tokenSelectorType === "send") {
      setSendToken(finalToken);
    } else {
      setReceiveToken(finalToken);
    }
    setValueIn("");
  }

  async function handleSwap() {
    if (!selectedPoolInfo) return;

    const [sendTokenLogo, receiveTokenLogo] = await Promise.all([
      sendToken.Logo || (await fetchTokenByProcessId(sendToken.processId, true))?.Logo || "",
      receiveToken.Logo || (await fetchTokenByProcessId(receiveToken.processId, true))?.Logo || "",
    ]);

    const swapData = {
      selectedPoolInfo,
      slippage,
      sendToken: { ...sendToken, Logo: sendTokenLogo },
      receiveToken: { ...receiveToken, Logo: receiveTokenLogo },
      wanderFee,
      networkFee,
      amountIn,
      swapper: activeAddress,
      tier: defiFeeDetails.tier,
    } satisfies SwapData;

    await TempTransactionStorage.set("swap-data", swapData);

    navigate(PopupPaths.SwapReview);
  }

  useEffect(() => {
    trackPage(PageType.SWAP);
  }, []);

  useAsyncEffect(async () => {
    if (loadSwapData !== "true") return;

    const swapData = await TempTransactionStorage.get<SwapData>("swap-data");
    if (swapData) {
      const sendToken = swapData.sendToken;
      const receiveToken = swapData.receiveToken;
      const amountIn = swapData.amountIn;
      const slippage = swapData.slippage;
      const valueIn = fromTokenBaseUnits(amountIn, sendToken.Denomination);

      setSendToken(sendToken);
      setReceiveToken(receiveToken);
      setValueIn(valueIn);
      setSlippage(slippage);
    }
  }, [loadSwapData]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("swap")} back={() => navigate(PopupPaths.Home)} />
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
              onMaxClick={() => setValueIn(maxValueIn !== "NaN" ? maxValueIn : "0")}
            />
            <Switch onClick={handleSwitch} isError={!!errorMessage || !!poolError}>
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
            {(errorMessage || poolError) && (
              <ErrorMsg>
                {errorMessage || poolError} <ErrorIcon style={{ verticalAlign: "text-top" }} size={14} />
              </ErrorMsg>
            )}
          </Flex>
          <Flex direction="column" gap={8}>
            <TransactionDetailItem
              title={browser.i18n.getMessage("rate")}
              value={rate}
              isLoading={amountIn && isLoading}
            />
            <TransactionDetailItem
              title={browser.i18n.getMessage("slippage")}
              value={
                <Flex gap={4} align="center" justify="center">
                  <Text variant="secondary" size="sm" weight="medium" noMargin>
                    {slippage}%{" "}
                  </Text>
                  <AutoTag slippage={slippage} />
                </Flex>
              }
            />
            <TransactionDetailItem
              title={browser.i18n.getMessage("network_provider_fee")}
              value={providerNetworkFee}
              isLoading={amountIn && isLoading}
            />
            <TransactionDetailItem
              title={browser.i18n.getMessage("wander_fee")}
              isLoading={amountIn && isLoading}
              value={
                <Flex justify="flex-end" align="center" gap={4} textAlign="right" wrap="wrap">
                  {selectedPoolInfo && wanderFee?.hasChanged && (
                    <CrossedOutText style={{ order: 1 }}>
                      {toFixed(wanderFee?.originalFee, 8)} {sendToken.Ticker}
                    </CrossedOutText>
                  )}
                  <Text
                    size="sm"
                    weight="medium"
                    style={{
                      color: "#9787FF",
                      order: 2,
                      textAlign: "right",
                    }}
                    noMargin>
                    {selectedPoolInfo && wanderFee?.finalFee !== "--"
                      ? wanderFee?.finalFee === "0"
                        ? browser.i18n.getMessage("free")
                        : `${toFixed(wanderFee?.finalFee, 8)} ${sendToken.Ticker}`
                      : "--"}
                  </Text>
                  {selectedPoolInfo && wanderFee.finalFee !== "--" && <WanderFeeTag style={{ order: 3 }} />}
                </Flex>
              }
            />
            <TransactionDetailItem
              title={browser.i18n.getMessage("price_impact")}
              value={selectedPoolInfo?.priceImpact ? `${selectedPoolInfo.priceImpact}%` : "--"}
              valueColor={getPriceImpactColor(selectedPoolInfo?.priceImpact, theme)}
              isLoading={amountIn && isLoading}
            />
          </Flex>

          <DisclosureButton
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            expandedMessageName="advanced"
            collapsedMessageName="advanced"
            textVariant="tertiary"
            enableScroll={true}
          />

          <DisclosureContent expanded={showAdvanced} style={{ paddingBottom: 8 }}>
            <SlippageInputButton type="swap" slippage={slippage} setSlippage={setSlippage} />
          </DisclosureContent>
        </WrapperContent>

        <Flex gap={8}>
          <Button
            style={{ flex: 1 }}
            disabled={
              !debouncedValueIn ||
              isLoading ||
              isNetworkFeeLoading ||
              !!errorMessage ||
              !!poolError ||
              isSwapGated ||
              !+valueOut
            }
            loading={amountIn && isLoading}
            onClick={handleSwap}
            fullWidth>
            {debouncedValueIn ? browser.i18n.getMessage("review") : browser.i18n.getMessage("enter_amount")}
          </Button>
          <Button
            width="72px"
            variant="secondary"
            icon={<ClockRewind height={24} width={24} />}
            onClick={() => navigate(PopupPaths.SwapHistory)}
          />
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
  bottom: 16px;
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

const ErrorMsg = styled(Text).attrs({
  size: "xs",
  weight: "medium",
  noMargin: true,
})`
  color: ${(props) => props.theme.fail};
`;
