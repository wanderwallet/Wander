import { Section, Button, Text, Loading, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { TokenLogo } from "~components/popup/TokenLogo";
import { HorizontalLine } from "~components/HorizontalLine";
import { AutoTag } from "./components/AutoTag";
import { WanderFeeTag } from "./components/WanderFeeTag";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TempTransactionStorage } from "~utils/storage";
import { formatBalance } from "~utils/format";
import {
  useARNetworkFee,
  usePoolQuote,
  useProviderNetworkFee,
  useSavedSwapData,
  useSwapRate,
} from "./utils/swap.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  executeSwapFn,
  fromTokenBaseUnits,
  getPriceImpactColor,
  getProviderName,
  getSwapTime,
  swapsArray,
  toFixed,
} from "./utils/swap.utils";
import { useDefiFeeDetails } from "~utils/tier/hooks";
import { PageType, trackPage } from "~utils/analytics";
import { startSwapMonitoring } from "./utils/alarms/swap-monitor/swap-monitor-alarm.handler";
import { useActiveWallet } from "~wallets/hooks";
import { UR } from "@ngraveio/bc-ur";
import { decodeSignature, type KeystoneInteraction, KeystoneSigner } from "~wallets/hardware/keystone";
import { useScanner } from "@arconnect/keystone-sdk";
import AnimatedQRScanner from "~components/hardware/AnimatedQRScanner";
import AnimatedQRPlayer from "~components/hardware/AnimatedQRPlayer";
import { Spacer } from "~components/embed";
import { SignType } from "@keystonehq/bc-ur-registry-arweave";
import Arweave from "arweave";
import { HARDWARE_WALLET_API_NOT_SUPPORTED_ERR_MSG } from "~utils/wallets/wallets.constants";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { PoolTypeEnum } from "./utils/swap.constants";

export function SwapReviewView() {
  const { navigate } = useLocation();
  const theme = useTheme();
  const wallet = useActiveWallet();
  const { setToast } = useToasts();
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapData] = useSavedSwapData();
  const defiFeeDetails = useDefiFeeDetails();
  const [transactionUR, setTransactionUR] = useState<UR>();
  const [hardwareStatus, setHardwareStatus] = useState<"play" | "scan">();
  const [currentTransactionCount, setCurrentTransactionCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);

  const { sendToken, receiveToken, wanderFee, slippage, amountIn } = swapData || {};

  const isAo = useMemo(() => sendToken?.processId !== AR_PROCESS_ID, [sendToken]);

  const keystoneInteraction = useMemo(() => {
    const keystoneInteraction: KeystoneInteraction = {
      display(data) {
        setCurrentTransactionCount((prev) => prev + 1);
        setTransactionUR(data);
        setHardwareStatus("play");
        scanner.retry();
      },
    };
    return keystoneInteraction;
  }, []);

  const keystoneSigner = useMemo(() => {
    if (wallet?.type !== "hardware") return null;
    const keystoneSigner = new KeystoneSigner(
      Buffer.from(Arweave.utils.b64UrlToBuffer(wallet.publicKey)),
      wallet.xfp,
      isAo ? SignType.DataItem : SignType.Transaction,
      keystoneInteraction,
    );
    return keystoneSigner;
  }, [wallet, keystoneInteraction, isAo]);

  const { networkFee, isLoading: isNetworkFeeLoading } = useARNetworkFee({
    tokenIn: sendToken?.processId,
    tokenOut: receiveToken?.processId,
  });

  const { selectedPoolInfo: selectedPoolInfoQuote, isLoading } = usePoolQuote({
    tokenIn: sendToken?.processId,
    tokenOut: receiveToken?.processId,
    slippage,
    amountIn,
    poolId: swapData?.selectedPoolInfo?.poolId,
    poolType: swapData?.selectedPoolInfo?.poolType,
    stopFetching: isExecutingSwap || !!hardwareStatus,
    wanderFeePercent: +defiFeeDetails.finalFeePercent,
  });

  const selectedPoolInfo = useMemo(() => {
    return selectedPoolInfoQuote || swapData?.selectedPoolInfo;
  }, [selectedPoolInfoQuote, swapData?.selectedPoolInfo]);

  const totalTransactionCount = selectedPoolInfo?.poolType === PoolTypeEnum.PERMASWAP ? 3 : 2;

  const rate = useSwapRate({ selectedPoolInfo, sendToken, receiveToken, amountIn });

  const providerNetworkFee = useProviderNetworkFee({ selectedPoolInfo, sendToken, receiveToken, networkFee });

  const valueIn = useMemo(() => {
    if (!amountIn || !sendToken) return "";
    return fromTokenBaseUnits(amountIn, sendToken.Denomination);
  }, [amountIn, sendToken]);

  const valueOutFormatted = useMemo(() => {
    const amountOut = selectedPoolInfo?.quoteOutput?.amountOut;
    if (!valueIn || !amountOut || !receiveToken) return formatBalance("0");

    const value = fromTokenBaseUnits(selectedPoolInfo.quoteOutput.amountOut, receiveToken.Denomination);
    return formatBalance(value);
  }, [selectedPoolInfo, receiveToken, valueIn]);

  const valueInFormatted = useMemo(() => formatBalance(valueIn || "0"), [valueIn]);

  const handleScannerResult = useCallback(
    async (res: UR) => {
      try {
        if (!res) return;

        if (wallet?.type !== "hardware") {
          throw new Error("Wallet switched while signing");
        }

        // decode signature
        const { id, signature } = await decodeSignature(res);

        if (isAo) {
          keystoneSigner.submitSignature(signature);
        } else {
          keystoneSigner.submitSignature({ id, signature } as any);
        }
        setSubmissionCount((prev) => prev + 1);
      } catch (e) {
        log(LOG_GROUP.SWAP, "Error decoding signature", e);
      }
    },
    [wallet, keystoneSigner, isAo],
  );

  // qr-tx scanner
  const scanner = useScanner(handleScannerResult);

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

      const poolType = selectedPoolInfo?.poolType;

      const tags = [
        { name: "X-Client", value: "Wander" },
        { name: "X-Type", value: "Swap" },
        { name: "X-Rate", value: rate },
        { name: "X-Provider", value: getProviderName(poolType) },
        { name: "X-Provider-Network-Fee", value: providerNetworkFee || `0 ${sendToken?.Ticker}` },
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
            processId: sendToken.processId,
          }),
        },
        {
          name: "X-Token-Out",
          value: JSON.stringify({
            Name: receiveToken.Name,
            Ticker: receiveToken.Ticker,
            Denomination: receiveToken.Denomination,
            Logo: receiveToken.Logo,
            processId: receiveToken.processId,
          }),
        },
        { name: "X-Amount-In", value: amountIn },
        { name: "X-Amount-Out", value: selectedPoolInfo.quoteOutput.amountOut },
      ];

      const { transferId, noteSettle, debitNoticeId, keystoneTx } = await executeSwapFn(poolType, {
        tokenIn: sendToken?.processId,
        tokenOut: receiveToken?.processId,
        amountIn: selectedPoolInfo.quoteOutput.transferAmountIn,
        minAmountOut: selectedPoolInfo.quoteOutput.amountOut,
        poolId: selectedPoolInfo.poolId,
        tags,
        keystoneSigner: wallet?.type === "hardware" ? keystoneSigner : undefined,
        wanderFee: selectedPoolInfo.quoteOutput.wanderFee,
      });

      const updatedSwapData = {
        ...swapData,
        selectedPoolInfo,
        transferId,
        noteSettle,
        debitNoticeId,
        keystoneTx,
        timestamp: Date.now(),
        status: "pending" as const,
        monitoringStarted: true,
      };
      await TempTransactionStorage.set("swap-data", updatedSwapData);
      await swapsArray.push(updatedSwapData);

      // Start background monitoring
      await startSwapMonitoring();

      navigate(PopupPaths.SwapProgress);
    } catch (err) {
      log(LOG_GROUP.SWAP, "Error executing swap", err);
      const errorMessage = err instanceof Error ? err.message : "Swap error. Please try again.";
      setToast({
        type: "error",
        content: errorMessage.includes(HARDWARE_WALLET_API_NOT_SUPPORTED_ERR_MSG)
          ? browser.i18n.getMessage("wallet_hardware_unsupported")
          : browser.i18n.getMessage("swap_error"),
        duration: 2400,
      });
    } finally {
      setIsExecutingSwap(false);
      setHardwareStatus(null);
      setCurrentTransactionCount(0);
      setTransactionUR(null);
    }
  }

  useEffect(() => {
    trackPage(PageType.SWAP_REVIEW);
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
      <HeadV2
        title={browser.i18n.getMessage("review")}
        back={() => navigate(PopupPaths.Swap, { search: { loadSwapData: "true" } })}
      />
      <Wrapper>
        {(hardwareStatus === "play" && transactionUR) || hardwareStatus === "scan" ? (
          <WrapperContent style={{ overflow: "visible" }}>
            <Flex direction="column" gap={8}>
              <Text noMargin style={{ textAlign: "center" }}>
                {currentTransactionCount}/{totalTransactionCount}
              </Text>
              {hardwareStatus === "play" && transactionUR && (
                <Flex direction="column" align="center" justify="center" textAlign="center" gap={16}>
                  <Text weight="medium" noMargin>
                    {browser.i18n.getMessage("sign_scan_qr")}
                  </Text>
                  <AnimatedQRPlayer data={transactionUR} />
                </Flex>
              )}
              {hardwareStatus === "scan" && (
                <Flex direction="column" align="center" justify="center" textAlign="center">
                  <AnimatedQRScanner
                    {...scanner.bindings}
                    onError={(error) =>
                      setToast({
                        type: "error",
                        duration: 2300,
                        content: browser.i18n.getMessage(`keystone_${error}`),
                      })
                    }
                  />
                  <Spacer y={1} />
                  <Text style={{ textAlign: "center" }} noMargin>
                    {browser.i18n.getMessage("keystone_scan_progress", `${scanner.progress.toFixed(0)}%`)}
                  </Text>
                </Flex>
              )}
            </Flex>
          </WrapperContent>
        ) : (
          <WrapperContent>
            <Flex direction="column" gap={16}>
              <Flex direction="column" gap={8}>
                <Text variant="secondary" size="sm" weight="medium" noMargin>
                  {browser.i18n.getMessage("you_send")}
                </Text>
                <Flex direction="row" align="center" gap={4}>
                  <TokenLogo size={24} token={sendToken} />
                  <TokenValueWithTooltip
                    formattedValue={valueInFormatted}
                    ticker={sendToken?.Ticker}
                    tooltipPosition="bottom"
                  />
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
                        {wanderFee?.finalFee !== "--"
                          ? wanderFee?.finalFee === "0"
                            ? browser.i18n.getMessage("free")
                            : `${toFixed(wanderFee?.finalFee, 8)} ${sendToken.Ticker}`
                          : "--"}
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
        )}

        <Flex gap={8}>
          <Button
            style={{ flex: 1 }}
            disabled={
              ((isExecutingSwap || isLoading || isNetworkFeeLoading) && !hardwareStatus) || hardwareStatus === "scan"
            }
            onClick={async () => {
              if (!isExecutingSwap) await handleSwap();
              else if (!hardwareStatus || hardwareStatus === "play") {
                setHardwareStatus((val) => (val === "play" ? "scan" : "play"));
              }
            }}
            fullWidth>
            {(isExecutingSwap && !hardwareStatus) ||
            (hardwareStatus === "scan" && submissionCount === totalTransactionCount) ? (
              <>
                {browser.i18n.getMessage("submitting")} <Loading style={{ marginLeft: 4 }} />
              </>
            ) : (isLoading && !hardwareStatus) || hardwareStatus === "scan" ? (
              <Loading />
            ) : hardwareStatus === "play" ? (
              browser.i18n.getMessage("keystone_scan")
            ) : (
              browser.i18n.getMessage("swap")
            )}
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
