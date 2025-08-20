import { Section, Button, Text, Loading } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import { TokenLogo } from "~components/popup/TokenLogo";
import { HorizontalLine } from "~components/HorizontalLine";
import { AutoTag } from "./components/AutoTag";
import { WanderFeeTag } from "./components/WanderFeeTag";
import { useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { TempTransactionStorage } from "~utils/storage";
import type { SwapData } from "./utils/swap.types";
import BigNumber from "bignumber.js";
import { formatBalance } from "~utils/format";
import { usePoolQuote } from "./utils/swap.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { botega } from "./utils/dex/dex.botega";
import { permaswap } from "./utils/dex/dex.permaswap";
import { log, LOG_GROUP } from "~utils/log/log.utils";

export function SwapReviewView() {
  const { navigate } = useLocation();
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapData] = useStorage<SwapData>({ key: "swap-data", instance: TempTransactionStorage });

  const { sendToken, receiveToken, wanderFee, slippage, amountIn } = swapData || {};

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
    return `1 ${sendToken.Ticker} ≈ ${valueOutForUnitValueIn.toFixed(8)} ${receiveToken.Ticker}`;
  }, [selectedPoolInfo, sendToken, receiveToken]);

  const networkFee = useMemo(() => {
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
      setIsExecutingSwap(true);

      const executeSwapFn = selectedPoolInfo?.pool?.poolType === "botega" ? botega.executeSwap : permaswap.executeSwap;
      const transferId = await executeSwapFn({
        tokenIn: sendToken?.processId,
        tokenOut: receiveToken?.processId,
        amountIn,
        minAmountOut: selectedPoolInfo.quoteOutput.amountOut,
        poolId: selectedPoolInfo.pool.poolId,
      });

      TempTransactionStorage.set("swap-data", { ...swapData, selectedPoolInfo: selectedPoolInfoQuote, transferId });
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
              <TransactionDetailItem
                title={"Provider"}
                value={selectedPoolInfo?.pool?.poolType === "botega" ? "Botega" : "Permaswap"}
              />
              <TransactionDetailItem title={"Est. Swap Time"} value={"15s"} />
              <TransactionDetailItem title={"Network fee"} value={networkFee} />
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
              />
            </Flex>
          </Flex>
        </WrapperContent>

        <Flex gap={8}>
          <Button
            style={{ flex: 1 }}
            disabled={isExecutingSwap || isLoading}
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
