import { Section, Text, Loading, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { useMemo } from "react";
import { WanderLoading } from "~routes/welcome/WanderLoading";
import { formatBalance } from "~utils/format";
import { TokenLogo } from "~components/popup/TokenLogo";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { ArrowRight, LinkExternal02 } from "@untitled-ui/icons-react";
import BigNumber from "bignumber.js";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { botega } from "./utils/dex/dex.botega";
import { permaswap } from "./utils/dex/dex.permaswap";
import { getActiveAddress } from "~wallets";
import { queryClient } from "~utils/tanstack";
import { PoolTypeEnum } from "./utils/swap.constants";
import { useSavedSwapData } from "./utils/swap.hooks";
import { aox } from "./utils/bridge/bridge.aox";

export function SwapProgressView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const [swapData] = useSavedSwapData();

  const { sendToken, receiveToken, amountIn, selectedPoolInfo, transferId } = swapData || {};

  const isAoxBridge = useMemo(() => selectedPoolInfo?.pool?.poolType === PoolTypeEnum.AOX, [selectedPoolInfo]);

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

  useAsyncEffect(async () => {
    if (!transferId || !selectedPoolInfo) return;

    const poolType = selectedPoolInfo?.pool?.poolType;

    const waitForSwapResultFn =
      poolType === PoolTypeEnum.BOTEGA
        ? botega.waitForSwapResult
        : poolType === PoolTypeEnum.AOX
          ? aox.waitForSwapResult
          : permaswap.waitForSwapResult;

    const isSuccess = await waitForSwapResultFn(transferId);
    if (isSuccess) {
      const activeAddress = await getActiveAddress();
      queryClient.invalidateQueries({ queryKey: ["tokenBalance", receiveToken?.processId, activeAddress] });
      navigate(PopupPaths.SwapComplete);
    } else {
      navigate(PopupPaths.SwapFailed);
    }
  }, [transferId, selectedPoolInfo]);

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
      <HeadV2 title="Swap in progress" />
      <Wrapper>
        <WrapperContent>
          <WanderLoading />
          <Flex direction="column" gap={16} padding="0 8px" style={{ marginTop: -6 }}>
            <Flex direction="row" justify="center" align="center" gap={16}>
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={sendToken} />
                <TokenValueWithTooltip formattedValue={valueInFormatted} ticker={sendToken?.Ticker} textSize="base" />
              </Flex>
              <ArrowRight style={{ width: 24, height: 24, color: theme.secondaryText }} />
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={receiveToken} />
                <TokenValueWithTooltip
                  formattedValue={valueOutFormatted}
                  ticker={receiveToken?.Ticker}
                  textSize="base"
                />
              </Flex>
            </Flex>
            <Text variant="secondary" weight="medium" noMargin>
              Your swap is in progress. This may take {isAoxBridge ? "between 30-60 minutes" : "a few minutes"} to
              complete.
            </Text>
          </Flex>
        </WrapperContent>

        <Flex gap={12}>
          {isAoxBridge && (
            <Button fullWidth onClick={() => navigate(PopupPaths.Home)}>
              Go to dashboard
            </Button>
          )}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => browser.tabs.create({ url: `https://www.ao.link/#/message/${transferId}` })}>
            AO Link
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
  align-items: center;
  justify-content: center;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  text-align: center;
`;
