import { Section, Button, Text, Loading } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { TokenLogo } from "~components/popup/TokenLogo";
import { AutoTag } from "./components/AutoTag";
import { WanderFeeTag } from "./components/WanderFeeTag";
import { useEffect, useMemo } from "react";
import { formatBalance } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { ArrowRight, LinkExternal02 } from "@untitled-ui/icons-react";
import checkmarkAnimationData from "assets/lotties/checkmark.json";
import Lottie from "react-lottie";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { HorizontalLine } from "~components/HorizontalLine";
import { fromTokenBaseUnits, getPriceImpactColor, getProviderName, getSwapTime, toFixed } from "./utils/swap.utils";
import { useARNetworkFee, useProviderNetworkFee, useSavedSwapData, useSwapRate } from "./utils/swap.hooks";
import { PageType, trackPage } from "~utils/analytics";
import { TempTransactionStorage } from "~utils/storage";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { PoolTypeEnum } from "./utils/swap.constants";

export function SwapCompleteView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const [swapData] = useSavedSwapData();

  const { sendToken, receiveToken, wanderFee, slippage, amountIn, selectedPoolInfo, transferId } = swapData || {};

  const swap = useMemo(() => {
    const poolType = selectedPoolInfo?.poolType;
    const isBridge = poolType === PoolTypeEnum.AOX || poolType === PoolTypeEnum.VENTO;
    const isAo = sendToken?.processId !== AR_PROCESS_ID;
    return { isBridge, isAo };
  }, [selectedPoolInfo, sendToken]);

  const { networkFee } = useARNetworkFee({
    tokenIn: sendToken?.processId,
    tokenOut: receiveToken?.processId,
  });

  const rate = useSwapRate({ selectedPoolInfo, sendToken, receiveToken, amountIn });

  const providerNetworkFee = useProviderNetworkFee({ selectedPoolInfo, sendToken, receiveToken, networkFee });

  const valueIn = useMemo(() => {
    if (!amountIn || !sendToken) return "";
    return fromTokenBaseUnits(amountIn, sendToken.Denomination);
  }, [amountIn, sendToken]);

  const valueOutFormatted = useMemo(() => {
    if (!valueIn || !selectedPoolInfo?.quoteOutput?.amountOut || !receiveToken) return formatBalance("0");

    const value = fromTokenBaseUnits(selectedPoolInfo.quoteOutput.amountOut, receiveToken.Denomination);
    return formatBalance(value);
  }, [selectedPoolInfo, receiveToken, valueIn]);

  const valueInFormatted = useMemo(() => formatBalance(valueIn || "0"), [valueIn]);

  function handleOpen() {
    const url = swap.isAo
      ? `https://www.ao.link/#/message/${transferId}`
      : `https://viewblock.io/arweave/tx/${transferId}`;

    browser.tabs.create({ url });
  }

  useEffect(() => {
    trackPage(PageType.SWAP_COMPLETE);

    return () => {
      TempTransactionStorage.remove("swap-data");
    };
  }, []);

  if (!swapData) {
    return (
      <>
        <HeadV2 title={browser.i18n.getMessage("review")} />
        <Wrapper>
          <WrapperContent>
            <Flex direction="row" gap={8} align="center" justify="center" style={{ height: "100%" }}>
              <Text variant="secondary" noMargin>
                {browser.i18n.getMessage("loading")}
              </Text>
              <Loading style={{ height: 20, width: 20 }} />
            </Flex>
          </WrapperContent>
        </Wrapper>
      </>
    );
  }

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("swap_complete")} showBack={false} />
      <Wrapper>
        <WrapperContent>
          <Flex direction="column" justify="center" align="center" gap={4}>
            {/* @ts-expect-error - Lottie is not typed */}
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: checkmarkAnimationData,
                rendererSettings: {
                  preserveAspectRatio: "xMidYMid slice",
                },
              }}
              height={120}
              width={120}
            />
            <Text size="xl" weight="bold" noMargin>
              {browser.i18n.getMessage("swap_success")}
            </Text>
          </Flex>
          <Flex direction="row" justify="center" align="center" gap={16}>
            <Flex direction="row" align="center" gap={4}>
              <TokenLogo size={24} token={sendToken} />
              <TokenValueWithTooltip formattedValue={valueInFormatted} ticker={sendToken?.Ticker} textSize="base" />
            </Flex>
            <ArrowRight style={{ width: 24, height: 24, color: theme.secondaryText }} />
            <Flex direction="row" align="center" gap={4}>
              <TokenLogo size={24} token={receiveToken} />
              <TokenValueWithTooltip formattedValue={valueOutFormatted} ticker={receiveToken?.Ticker} textSize="base" />
            </Flex>
          </Flex>
          <HorizontalLine />
          <Flex direction="column" gap={16}>
            <Text weight="medium" noMargin>
              {browser.i18n.getMessage("transactions_details")}
            </Text>
            <Flex direction="column" gap={8}>
              <TransactionDetailItem title={browser.i18n.getMessage("rate")} value={rate} />
              <TransactionDetailItem
                title={browser.i18n.getMessage("provider")}
                value={getProviderName(selectedPoolInfo?.poolType)}
              />
              <TransactionDetailItem
                title={browser.i18n.getMessage("est_swap_time")}
                value={getSwapTime(selectedPoolInfo?.poolType)}
              />
              <TransactionDetailItem
                title={browser.i18n.getMessage("network_provider_fee")}
                value={providerNetworkFee}
              />
              <TransactionDetailItem
                title={browser.i18n.getMessage("wander_fee")}
                value={
                  <Flex justify="flex-end" align="center" gap={4} textAlign="right" wrap="wrap">
                    {wanderFee?.hasChanged && (
                      <CrossedOutText style={{ order: 1 }}>{toFixed(wanderFee?.originalFee, 8)}</CrossedOutText>
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
                      {wanderFee?.finalFee !== "--" ? `${toFixed(wanderFee?.finalFee, 8)} ${sendToken.Ticker}` : "--"}
                    </Text>
                    {wanderFee.finalFee !== "--" && <WanderFeeTag style={{ order: 3 }} />}
                  </Flex>
                }
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
                title={browser.i18n.getMessage("price_impact")}
                value={selectedPoolInfo?.priceImpact ? `${selectedPoolInfo.priceImpact}%` : "--"}
                valueColor={getPriceImpactColor(selectedPoolInfo?.priceImpact, theme)}
              />
            </Flex>
          </Flex>
        </WrapperContent>

        <Flex direction="column" gap={12}>
          <Button onClick={() => navigate(PopupPaths.Home)} fullWidth>
            {browser.i18n.getMessage("done")}
          </Button>
          <Button variant="secondary" fullWidth onClick={handleOpen}>
            {swap.isAo ? "AOLink" : "Viewblock"}
            <LinkExternal02 style={{ marginLeft: "8px" }} />
          </Button>
        </Flex>
      </Wrapper>
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
  gap: 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
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
