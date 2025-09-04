import styled, { useTheme } from "styled-components";
import { Button, Section } from "@arconnect/components-rebrand";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Flex } from "~components/common/Flex";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { HorizontalLine } from "~components/HorizontalLine";
import { TokenLogo } from "~components/popup/TokenLogo";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { getPriceImpactColor, getSwapTime } from "./utils/swap.utils";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import { useMemo } from "react";
import { formatBalance } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";
import { useSwapTransaction } from "./utils/swap.hooks";
import BigNumber from "bignumber.js";
import Skeleton from "~components/Skeleton";

export interface SwapTransactionDetailsParams {
  id: string;
}

export type SwapTransactionDetailsViewProps = CommonRouteProps<SwapTransactionDetailsParams>;

export function SwapTransactionDetailsView({ params: { id } }: SwapTransactionDetailsViewProps) {
  const theme = useTheme();
  const { back } = useLocation();

  const { transaction, loading } = useSwapTransaction(id);

  const valueInFormatted = useMemo(() => {
    if (!transaction || !transaction.amountIn || !transaction.tokenIn) return formatBalance("0");

    const value = BigNumber(transaction.amountIn || "0")
      .shiftedBy(-transaction.tokenIn.Denomination)
      .toFixed();

    return formatBalance(value);
  }, [transaction]);

  const valueOutFormatted = useMemo(() => {
    if (!transaction || !transaction.amountOut || !transaction.tokenOut) return formatBalance("0");

    const value = BigNumber(transaction.amountOut || "0")
      .shiftedBy(-transaction.tokenOut.Denomination)
      .toFixed();

    return formatBalance(value);
  }, [transaction]);

  function handleOpen() {
    const url = transaction.isAo ? `https://www.ao.link/#/message/${id}` : `https://viewblock.io/arweave/tx/${id}`;

    browser.tabs.create({ url });
  }

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("transaction_details")} />
      <Wrapper>
        {loading || !transaction ? (
          <>
            <WrapperContent>
              <Flex direction="column" gap={16}>
                <Flex direction="column" gap={8}>
                  <Text variant="secondary" size="sm" weight="medium" noMargin>
                    <Skeleton width="4rem" />
                  </Text>
                  <Flex direction="row" align="center" gap={4}>
                    <SkeletonTokenLogo />
                    <Skeleton width="8rem" />
                  </Flex>
                </Flex>
                <Flex direction="column" gap={8}>
                  <Text variant="secondary" size="sm" weight="medium" noMargin>
                    <Skeleton width="5rem" />
                  </Text>
                  <Flex direction="row" align="center" gap={4}>
                    <SkeletonTokenLogo />
                    <Skeleton width="6rem" />
                  </Flex>
                </Flex>
              </Flex>
              <HorizontalLine />
              <Flex direction="column" gap={16}>
                <Text weight="medium" noMargin>
                  <Skeleton width="8rem" />
                </Text>
                <Flex direction="column" gap={8}>
                  {new Array(7).fill("").map((_, i) => (
                    <TransactionDetailItem
                      key={i}
                      title={<Skeleton width="6rem" />}
                      value={<Skeleton width="5rem" />}
                    />
                  ))}
                </Flex>
              </Flex>
            </WrapperContent>

            <Flex direction="column" gap={12}>
              <Button fullWidth disabled>
                <Skeleton width="3rem" />
              </Button>
              <Button variant="secondary" fullWidth disabled>
                <Skeleton width="4rem" />
              </Button>
            </Flex>
          </>
        ) : (
          <>
            <WrapperContent>
              <Flex direction="column" gap={16}>
                <Flex direction="column" gap={8}>
                  <Text variant="secondary" size="sm" weight="medium" noMargin>
                    {browser.i18n.getMessage("you_send")}
                  </Text>
                  <Flex direction="row" align="center" gap={4}>
                    <TokenLogo size={24} token={transaction.tokenIn} fetchMissingLogo />
                    <TokenValueWithTooltip
                      formattedValue={valueInFormatted}
                      ticker={transaction.tokenIn.Ticker}
                      tooltipPosition="bottom"
                    />
                  </Flex>
                </Flex>
                <Flex direction="column" gap={8}>
                  <Text variant="secondary" size="sm" weight="medium" noMargin>
                    {browser.i18n.getMessage("you_receive")}
                  </Text>
                  <Flex direction="row" align="center" gap={4}>
                    <TokenLogo size={24} token={transaction.tokenOut} fetchMissingLogo />
                    <TokenValueWithTooltip formattedValue={valueOutFormatted} ticker={transaction.tokenOut.Ticker} />
                  </Flex>
                </Flex>
              </Flex>
              <HorizontalLine />
              <Flex direction="column" gap={16}>
                <Text weight="medium" noMargin>
                  {browser.i18n.getMessage("transactions_details")}
                </Text>
                <Flex direction="column" gap={8}>
                  <TransactionDetailItem title={browser.i18n.getMessage("rate")} value={transaction.rate} />
                  <TransactionDetailItem title={browser.i18n.getMessage("provider")} value={transaction.provider} />
                  <TransactionDetailItem
                    title={browser.i18n.getMessage("est_swap_time")}
                    value={getSwapTime(transaction.provider)}
                  />
                  <TransactionDetailItem
                    title={browser.i18n.getMessage("network_provider_fee")}
                    value={transaction.networkProviderFee}
                  />
                  <TransactionDetailItem
                    title={browser.i18n.getMessage("wander_fee")}
                    valueColor={transaction.wanderFee === "0" && "#9787FF"}
                    value={
                      transaction.wanderFee === "0"
                        ? browser.i18n.getMessage("free")
                        : `${transaction.wanderFee} ${transaction.tokenIn.Ticker}`
                    }
                  />
                  <TransactionDetailItem title={browser.i18n.getMessage("slippage")} value={transaction.slippage} />
                  <TransactionDetailItem
                    title={browser.i18n.getMessage("price_impact")}
                    value={transaction.priceImpact}
                    valueColor={getPriceImpactColor(transaction.priceImpact.replace("%", ""), theme)}
                  />
                </Flex>
              </Flex>
            </WrapperContent>

            <Flex direction="column" gap={12}>
              <Button fullWidth onClick={() => back()}>
                {browser.i18n.getMessage("done")}
              </Button>
              <Button variant="secondary" fullWidth onClick={handleOpen}>
                {transaction.isAo ? "AOLink" : "Viewblock"}
                <LinkExternal02 style={{ marginLeft: "8px" }} />
              </Button>
            </Flex>
          </>
        )}
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: calc(100vh - 100px);
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
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

const SkeletonTokenLogo = styled(Skeleton)`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
`;
