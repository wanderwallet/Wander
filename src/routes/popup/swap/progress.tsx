import { Section, Text, Loading, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { useEffect, useMemo } from "react";
import { WanderLoading } from "~routes/welcome/WanderLoading";
import { formatBalance } from "~utils/format";
import { TokenLogo } from "~components/popup/TokenLogo";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { ArrowRight, LinkExternal02 } from "@untitled-ui/icons-react";
import BigNumber from "bignumber.js";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { getActiveAddress } from "~wallets";
import { queryClient } from "~utils/tanstack";
import { PoolTypeEnum } from "./utils/swap.constants";
import { useSavedSwapData } from "./utils/swap.hooks";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { trackPage, PageType } from "~utils/analytics";
import { swapsArray, waitForSwapResultFn } from "./utils/swap.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";

export function SwapProgressView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const [swapData] = useSavedSwapData();

  const { sendToken, receiveToken, amountIn, selectedPoolInfo, transferId, noteSettle, debitNoticeId, swapper } =
    swapData || {};

  const swap = useMemo(() => {
    const poolType = selectedPoolInfo?.poolType;
    const isBridge = poolType === PoolTypeEnum.AOX || poolType === PoolTypeEnum.VENTO;
    const isAo = sendToken?.processId !== AR_PROCESS_ID;
    return { isBridge, isAo };
  }, [selectedPoolInfo, sendToken]);

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

  function handleOpen() {
    const url = swap.isAo
      ? `https://www.ao.link/#/message/${transferId}`
      : `https://viewblock.io/arweave/tx/${transferId}`;

    browser.tabs.create({ url });
  }

  useAsyncEffect(async () => {
    if (!transferId || !selectedPoolInfo) return;

    // Check if swap is already completed in storage
    const existingSwap = await swapsArray.find((s) => s.transferId === transferId);
    if (existingSwap?.status === "completed") {
      navigate(PopupPaths.SwapComplete);
      return;
    } else if (existingSwap?.status === "failed") {
      navigate(PopupPaths.SwapFailed);
      return;
    }

    const poolType = selectedPoolInfo?.poolType;

    try {
      const { success, result } = await waitForSwapResultFn(poolType, {
        orderId: transferId,
        noteSettle,
        swapper,
        debitNoticeId,
        isAo: sendToken?.processId !== AR_PROCESS_ID,
      });
      if (success) {
        const activeAddress = await getActiveAddress();
        queryClient.invalidateQueries({ queryKey: ["tokenBalance", receiveToken?.processId, activeAddress] });
        queryClient.invalidateQueries({ queryKey: ["tokenBalance", sendToken?.processId, activeAddress] });

        // Update swap status in storage
        await swapsArray.updateWhere(
          (s) => s.transferId === transferId,
          (s) => {
            const expectedOutput = s.selectedPoolInfo.quoteOutput.amountOut;
            s.selectedPoolInfo.quoteOutput.amountOut = result?.amountOut || expectedOutput;
            return { ...s, status: "completed" as const, completedAt: Date.now(), showCompletionScreen: false };
          },
        );

        navigate(PopupPaths.SwapComplete);
      } else {
        await swapsArray.updateWhere(
          (s) => s.transferId === transferId,
          (s) => ({ ...s, status: "failed" as const, completedAt: Date.now() }),
        );
        navigate(PopupPaths.SwapFailed);
      }
    } catch (error) {
      log(LOG_GROUP.SWAP, "Error checking swap status in progress view", error);
    }
  }, [transferId, selectedPoolInfo, noteSettle, swapper, debitNoticeId, sendToken]);

  useEffect(() => {
    trackPage(PageType.SWAP_PROGRESS);
  }, []);

  if (!swapData) {
    return (
      <>
        <HeadV2 title={browser.i18n.getMessage("swap_in_progress")} />
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
      <HeadV2 title={browser.i18n.getMessage("swap_in_progress")} />
      <Wrapper>
        <WrapperContent>
          <WanderLoading />
          <Flex direction="column" gap={16} padding="0 8px" style={{ marginTop: -4 }} width="100%">
            <Flex direction="row" justify="center" align="center" gap={16}>
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={sendToken} style={{ flexShrink: 0 }} />
                <TokenValueWithTooltip formattedValue={valueInFormatted} ticker={sendToken?.Ticker} textSize="base" />
              </Flex>
              <ArrowRight style={{ width: 24, height: 24, color: theme.secondaryText, flexShrink: 0 }} />
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={receiveToken} style={{ flexShrink: 0 }} />
                <TokenValueWithTooltip
                  formattedValue={valueOutFormatted}
                  ticker={receiveToken?.Ticker}
                  textSize="base"
                />
              </Flex>
            </Flex>
            <Text variant="secondary" weight="medium" noMargin>
              {browser.i18n.getMessage(
                "swap_in_progress_description",
                swap.isBridge
                  ? browser.i18n.getMessage("between_30_60_minutes")
                  : browser.i18n.getMessage("a_few_minutes"),
              )}
            </Text>
          </Flex>
        </WrapperContent>

        <Flex direction="column" gap={12} padding="0 24px">
          {swap.isBridge && (
            <Button fullWidth onClick={() => navigate(PopupPaths.Home)}>
              {browser.i18n.getMessage("go_to_dashboard")}
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={handleOpen}>
            {swap.isAo ? "AOLink" : "Viewblock"}
            <LinkExternal02 style={{ marginLeft: "8px" }} />
          </Button>
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section).attrs({ showPaddingVertical: false, showPaddingHorizontal: false })`
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
  padding: 0 24px;
`;
