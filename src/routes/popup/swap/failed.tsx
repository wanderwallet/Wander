import { Section, Button, Text, Loading } from "@arconnect/components-rebrand";
import styled, { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import { TokenLogo } from "~components/popup/TokenLogo";
import { useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatBalance } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { ArrowRight } from "@untitled-ui/icons-react";
import { ErrorIcon } from "./components/ErrorIcon";
import { useSavedSwapData } from "./utils/swap.hooks";
import { PageType, trackPage } from "~utils/analytics";
import { TempTransactionStorage } from "~utils/storage";

export function SwapFailedView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const [swapData] = useSavedSwapData();

  const { sendToken, receiveToken, amountIn, selectedPoolInfo } = swapData || {};

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

  useEffect(() => {
    trackPage(PageType.SWAP_FAILED);
  }, []);

  if (!swapData) {
    return (
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
    );
  }

  return (
    <Wrapper>
      <WrapperContent>
        <Flex direction="column" justify="center" align="center" gap={24} textAlign="center">
          <ErrorIcon />
          <Text size="lg" weight="bold" noMargin>
            Swap could not be completed
          </Text>
        </Flex>
        <Text variant="secondary" weight="medium" noMargin>
          Looks like something went wrong, please try again.
        </Text>
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
      </WrapperContent>

      <Flex direction="column" gap={12}>
        <Button onClick={() => navigate(PopupPaths.Swap, { params: { loadSwapData: "true" } })} fullWidth>
          Try again
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            TempTransactionStorage.remove("swap-data");
            navigate(PopupPaths.Home);
          }}>
          Go to dashboard
        </Button>
      </Flex>
    </Wrapper>
  );
}

const Wrapper = styled(Section).attrs({ showPaddingVertical: false })`
  height: calc(100vh - 24px);
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  gap: 24px;
`;

const WrapperContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;
