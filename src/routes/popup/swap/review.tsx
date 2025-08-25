import { Section, Button, Text, Loading } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import { TokenLogo } from "~components/popup/TokenLogo";
import { HorizontalLine } from "~components/HorizontalLine";
import { AutoTag } from "./components/AutoTag";
import { WanderFeeTag } from "./components/WanderFeeTag";
import { useMemo, useState } from "react";
import { TempTransactionStorage } from "~utils/storage";
import BigNumber from "bignumber.js";
import { formatBalance } from "~utils/format";
import { useARNetworkFee, usePoolQuote, useSavedSwapData } from "./utils/swap.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { botega } from "./utils/dex/dex.botega";
import { permaswap } from "./utils/dex/dex.permaswap";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { getPriceImpactColor, getProviderName, getSwapTime, toFixed } from "./utils/swap.utils";
import { PoolTypeEnum } from "./utils/swap.constants";
import { aox } from "./utils/bridge/bridge.aox";

export function SwapReviewView() {
  const { navigate } = useLocation();
  const theme = useTheme();
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapData] = useSavedSwapData();

  const { sendToken, receiveToken, wanderFee, slippage, amountIn } = swapData || {};

  const { networkFee, isLoading: isNetworkFeeLoading } = useARNetworkFee({ tokenID: sendToken?.processId });

  const { selectedPoolInfo: selectedPoolInfoQuote, isLoading } = usePoolQuote({
    tokenIn: sendToken?.processId,
    tokenOut: receiveToken?.processId,
    slippage,
    amountIn,
    pool: swapData?.selectedPoolInfo?.pool,
    stopFetching: isExecutingSwap,
  });

  const selectedPoolInfo = useMemo(() => {
    return selectedPoolInfoQuote || swapData?.selectedPoolInfo;
  }, [selectedPoolInfoQuote, swapData?.selectedPoolInfo]);

  const rate = useMemo(() => {
    if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken) return "--";

    const valueIn = BigNumber(selectedPoolInfo.quoteOutput.amountInWithoutFee || "0").shiftedBy(
      -sendToken.Denomination,
    );
    const valueOut = BigNumber(selectedPoolInfo.quoteOutput.amountOut || "0").shiftedBy(-receiveToken.Denomination);

    if (valueIn.isZero()) return "--";

    const valueOutForUnitValueIn = valueOut.dividedBy(valueIn);
    return `1 ${sendToken.Ticker} ≈ ${toFixed(valueOutForUnitValueIn, 8)} ${receiveToken.Ticker}`;
  }, [selectedPoolInfo, sendToken, receiveToken]);

  const providerNetworkFee = useMemo(() => {
    if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken) return "--";

    const tokenInFee = BigNumber(selectedPoolInfo.quoteOutput.totalTokenInFeeQuantity || "0");
    const tokenOutFee = BigNumber(selectedPoolInfo.quoteOutput.totalTokenOutFeeQuantity || "0");

    const formatFee = (amount: BigNumber, token: TokenInfo) =>
      `${toFixed(amount.shiftedBy(-token.Denomination), 8)} ${token.Ticker}`;

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
  }, [selectedPoolInfo, sendToken, receiveToken, networkFee]);

  const valueIn = useMemo(() => {
    if (!amountIn || !sendToken) return "";
    return BigNumber(amountIn).shiftedBy(-sendToken.Denomination).toFixed();
  }, [amountIn, sendToken]);

  const valueOutFormatted = useMemo(() => {
    if (!valueIn || !selectedPoolInfo?.quoteOutput?.amountOut || !receiveToken) return formatBalance("0");

    const value = BigNumber(selectedPoolInfo.quoteOutput.amountOut || "0")
      .shiftedBy(-receiveToken.Denomination)
      .toFixed();

    return formatBalance(value);
  }, [selectedPoolInfo, receiveToken, valueIn]);

  const valueInFormatted = useMemo(() => formatBalance(valueIn || "0"), [valueIn]);

  async function handleSwap() {
    try {
      if (
        !selectedPoolInfo ||
        !sendToken ||
        !receiveToken ||
        !amountIn ||
        !slippage ||
        !rate ||
        !providerNetworkFee ||
        !wanderFee
      ) {
        return;
      }

      setIsExecutingSwap(true);

      const poolType = selectedPoolInfo?.pool?.poolType;

      const executeSwapFn =
        poolType === PoolTypeEnum.BOTEGA
          ? botega.executeSwap
          : poolType === PoolTypeEnum.PERMASWAP
            ? permaswap.executeSwap
            : aox.executeSwap;

      const tags = [
        { name: "X-Client", value: "Roam" }, // TODO: change this to the actual client name
        { name: "X-Type", value: "Swap" },
        { name: "X-Rate", value: rate },
        { name: "X-Provider", value: getProviderName(poolType) },
        { name: "X-Network-Fee", value: providerNetworkFee || `0 ${sendToken?.Ticker}` },
        { name: "X-Client-Fee", value: wanderFee?.finalFee || `0 ${sendToken?.Ticker}` },
        { name: "X-Slippage", value: `${slippage}%` },
        { name: "X-Price-Impact", value: `${selectedPoolInfo?.priceImpact || "0"}%` },
        {
          name: "X-Token-In",
          value: JSON.stringify({
            Name: sendToken.Name,
            Ticker: sendToken.Ticker,
            Denomination: sendToken.Denomination,
            Logo: sendToken.Logo,
            processId: sendToken.processId || sendToken.id,
          }),
        },
        {
          name: "X-Token-Out",
          value: JSON.stringify({
            Name: receiveToken.Name,
            Ticker: receiveToken.Ticker,
            Denomination: receiveToken.Denomination,
            Logo: receiveToken.Logo,
            processId: receiveToken.processId || receiveToken.id,
          }),
        },
        { name: "X-Amount-In", value: amountIn },
        { name: "X-Amount-Out", value: selectedPoolInfo.quoteOutput.amountOut },
      ];

      const transferId = await executeSwapFn({
        tokenIn: sendToken?.processId,
        tokenOut: receiveToken?.processId,
        amountIn,
        minAmountOut: selectedPoolInfo.quoteOutput.amountOut,
        poolId: selectedPoolInfo.pool.poolId,
        tags,
      });

      TempTransactionStorage.set("swap-data", { ...swapData, selectedPoolInfo, transferId });
      navigate(PopupPaths.SwapProgress);
    } catch (err) {
      log(LOG_GROUP.SWAP, "Error executing swap", err);
    } finally {
      setIsExecutingSwap(false);
    }
  }

  if (!swapData) {
    return (
      <>
        <HeadV2 title={browser.i18n.getMessage("review")} />
        <Wrapper>
          <WrapperContent>
            <Flex direction="row" gap={8} align="center" justify="center" style={{ height: "100%" }}>
              <Text variant="secondary" noMargin>
                Loading swap data...
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
      <HeadV2 title={browser.i18n.getMessage("review")} />
      <Wrapper>
        <WrapperContent>
          <Flex direction="column" gap={16}>
            <Flex direction="column" gap={8}>
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                {browser.i18n.getMessage("you_send")}
              </Text>
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={sendToken} />
                <TokenValueWithTooltip formattedValue={valueInFormatted} ticker={sendToken?.Ticker} />
              </Flex>
            </Flex>
            <Flex direction="column" gap={8}>
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                {browser.i18n.getMessage("you_receive")}
              </Text>
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={receiveToken} />
                <TokenValueWithTooltip formattedValue={valueOutFormatted} ticker={receiveToken?.Ticker} />
              </Flex>
            </Flex>
          </Flex>
          <HorizontalLine />
          <Flex direction="column" gap={16}>
            <Text weight="medium" noMargin>
              Transactions details
            </Text>
            <Flex direction="column" gap={8}>
              <TransactionDetailItem title={"Rate"} value={rate} />
              <TransactionDetailItem title={"Provider"} value={getProviderName(selectedPoolInfo?.pool?.poolType)} />
              <TransactionDetailItem title={"Est. Swap Time"} value={getSwapTime(selectedPoolInfo?.pool?.poolType)} />
              <TransactionDetailItem title={"Network fee"} value={providerNetworkFee} />
              <TransactionDetailItem
                title={"Wander Fee"}
                value={
                  <Flex justify="center" align="center" gap={4}>
                    {wanderFee?.hasChanged && <CrossedOutText>{wanderFee?.originalFee}</CrossedOutText>}
                    <Text size="sm" weight="medium" style={{ color: "#9787FF" }} noMargin>
                      {wanderFee?.finalFee || "--"}
                    </Text>
                    <WanderFeeTag />
                  </Flex>
                }
              />
              <TransactionDetailItem
                title={"Slippage"}
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
                title={"Price Impact"}
                value={selectedPoolInfo?.priceImpact ? `${selectedPoolInfo.priceImpact}%` : "--"}
                valueColor={getPriceImpactColor(selectedPoolInfo?.priceImpact, theme)}
              />
            </Flex>
          </Flex>
        </WrapperContent>

        <Flex gap={8}>
          <Button
            style={{ flex: 1 }}
            disabled={isExecutingSwap || isLoading || isNetworkFeeLoading}
            loading={isExecutingSwap || isLoading}
            onClick={handleSwap}
            fullWidth>
            {browser.i18n.getMessage("swap")}
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
