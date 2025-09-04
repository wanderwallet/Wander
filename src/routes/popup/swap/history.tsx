import styled from "styled-components";
import { Button, Loading, Section } from "@arconnect/components-rebrand";
import HeadV2 from "~components/popup/HeadV2";
import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useSwapTransactions } from "./utils/swap.hooks";
import type { ParsedSwapTransaction } from "./utils/swap.types";
import browser from "webextension-polyfill";
import dayjs from "dayjs";
import { getStatusColor } from "./utils/swap.utils";
import { useEffect, useMemo } from "react";
import { formatBalance } from "~utils/format";
import BigNumber from "bignumber.js";
import { TokenLogo } from "~components/popup/TokenLogo";
import { PageType, trackPage } from "~utils/analytics";

export function SwapHistoryView() {
  const { transactions, loading, hasNextPage, fetchTransactions } = useSwapTransactions();

  useEffect(() => {
    trackPage(PageType.SWAP_HISTORY);
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("swap_history")} />

      <Wrapper>
        <Flex gap={12} direction="column">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => <SwapHistoryListItem key={`${tx.txId}-${index}`} tx={tx} />)
          ) : (
            <Empty>
              {loading ? (
                <Loading style={{ height: "20px", width: "20px" }} />
              ) : (
                <Text size="md" weight="medium" noMargin style={{ textAlign: "center" }}>
                  {browser.i18n.getMessage("no_transactions")}
                </Text>
              )}
            </Empty>
          )}
        </Flex>
        {hasNextPage && (
          <Button
            fullWidth
            disabled={!hasNextPage || loading}
            style={{ alignSelf: "center", marginTop: "5px" }}
            loading={loading}
            onClick={() => fetchTransactions()}>
            {browser.i18n.getMessage("load_more")}...
          </Button>
        )}
      </Wrapper>
    </>
  );
}

interface SwapHistoryListItemProps {
  tx: ParsedSwapTransaction;
}

const SwapHistoryListItem = ({ tx }: SwapHistoryListItemProps) => {
  const { navigate } = useLocation();

  const valueInFormatted = useMemo(() => {
    if (!tx.amountIn || !tx.tokenIn) return formatBalance("0");

    const value = BigNumber(tx.amountIn || "0")
      .shiftedBy(-tx.tokenIn.Denomination)
      .toFixed();

    return formatBalance(value);
  }, [tx.amountIn, tx.tokenIn.Denomination]);

  const valueOutFormatted = useMemo(() => {
    if (!tx.amountOut || !tx.tokenOut) return formatBalance("0");

    const value = BigNumber(tx.amountOut || "0")
      .shiftedBy(-tx.tokenOut.Denomination)
      .toFixed();

    return formatBalance(value);
  }, [tx.amountOut, tx.tokenOut.Denomination]);

  return (
    <StyledListItem
      title={
        <Flex justify="space-between" align="center" width="100%">
          <Text weight="semibold" noMargin>
            {tx.tokenIn.Ticker} &gt; {tx.tokenOut.Ticker}
          </Text>
          <Flex align="center" gap={4}>
            <div
              style={{
                height: 6,
                width: 6,
                borderRadius: "50%",
                backgroundColor: getStatusColor(tx.status),
              }}
            />
            <Text size="sm" weight="medium" noMargin>
              {tx.status}
            </Text>
          </Flex>
        </Flex>
      }
      subtitle={
        <Flex gap={8} justify="space-between" align="flex-start" width="100%">
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {valueInFormatted.displayBalance} {tx.tokenIn.Ticker} &gt; {valueOutFormatted.displayBalance}{" "}
            {tx.tokenOut.Ticker}
          </Text>
          <Text size="sm" variant="secondary" weight="medium" style={{ flexShrink: 0 }} noMargin>
            {dayjs(tx.timestamp).format("MMM D")}
          </Text>
        </Flex>
      }
      squircleSize={40}
      hideSquircle={true}
      icon={
        <Flex direction="row" style={{ width: 32, position: "relative" }}>
          <TokenLogo
            token={tx.tokenIn}
            size={24}
            style={{ position: "absolute", top: -17, left: 2 }}
            fetchMissingLogo
          />
          <TokenLogo
            token={tx.tokenOut}
            size={24}
            style={{ position: "absolute", bottom: -17, right: -6 }}
            fetchMissingLogo
          />
        </Flex>
      }
      active
      onClick={() => navigate(PopupPaths.SwapTransactionDetails, { params: { id: tx.txId } })}
    />
  );
};

const StyledListItem = styled(ListItem)`
  width: 100%;
  text-align: left;
  padding: 12px 8px;
  box-sizing: border-box;
  border: 1px solid transparent;
  transition: none;
  outline: none;
  margin: 0;
  border-radius: 8px;
`;

const Wrapper = styled(Section)`
  height: calc(100vh - 100px);
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  gap: 12px;
`;

const Empty = styled.div`
  width: 100%;
  height: calc(100% - 64.59px);
  margin-top: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
