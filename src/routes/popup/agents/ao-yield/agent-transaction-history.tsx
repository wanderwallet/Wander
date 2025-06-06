import styled from "styled-components";
import { Button, Section, Text, ListItem } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useTransactions } from "~utils/agents/hooks";
import dayjs from "dayjs";
import { WAR_PROCESS_ID, WUSDC_PROCESS_ID } from "~tokens/aoTokens/ao";
import { SvgImageWithBackground } from "../components/SvgImage";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import WarIcon from "url:/assets/ecosystem/war.svg";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import { formatTokenQuantity, tokenIdInfoMap } from "~utils/agents/utils";

export interface AOYieldAgentTransactionHistoryParams {
  id: string;
}

export type AOYieldAgentTransactionHistoryViewProps = CommonRouteProps<AOYieldAgentTransactionHistoryParams>;

export function AOYieldAgentTransactionHistoryView({ params: { id } }: AOYieldAgentTransactionHistoryViewProps) {
  const { transactions, loading, hasNextPage, count, fetchTransactions } = useTransactions(id);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("transaction_history_title")} />
      <Wrapper>
        <Content>
          {transactions.map((transaction, i) => (
            <ListItem
              key={`${transaction.id}-${i}`}
              title={
                <Flex justify="space-between" align="center" width="100%">
                  <Text weight="semibold" noMargin>
                    {`AO <> ${tokenIdInfoMap[transaction?.tokenOut]?.ticker}`}
                  </Text>
                  <Text size="sm" weight="medium" noMargin>
                    -{formatTokenQuantity(transaction.amountIn, 12)} AO
                  </Text>
                </Flex>
              }
              subtitle={
                <Flex justify="space-between" align="center" width="100%">
                  <Text size="sm" variant="secondary" weight="medium" noMargin>
                    {dayjs(transaction.timestamp).format("MMM DD, YYYY")}
                  </Text>
                  <Text size="sm" weight="medium" noMargin>
                    +{formatTokenQuantity(transaction.amountOut, transaction?.tokenOut === WUSDC_PROCESS_ID ? 6 : 12)}{" "}
                    {tokenIdInfoMap[transaction?.tokenOut]?.ticker}
                  </Text>
                </Flex>
              }
              hideSquircle={true}
              icon={
                <Flex direction="row" style={{ width: 32, position: "relative" }}>
                  <SvgImageWithBackground
                    height={20}
                    width={20}
                    style={{ position: "absolute", top: -17, left: 2 }}
                    src={aoLogo}
                    iconSize={16}
                    iconColor="black"
                  />
                  <img
                    src={transaction.tokenOut === WAR_PROCESS_ID ? WarIcon : wUSDCIcon}
                    height={24}
                    width={24}
                    style={{ position: "absolute", bottom: -19, right: -6 }}
                  />
                </Flex>
              }
            />
          ))}
          {!loading && transactions.length === 0 && (
            <Text size="sm" variant="secondary" weight="medium" style={{ textAlign: "center" }} noMargin>
              {browser.i18n.getMessage("no_transactions")}
            </Text>
          )}
        </Content>

        {hasNextPage && (
          <Flex gap={8}>
            <Button disabled={loading} loading={loading} fullWidth onClick={fetchTransactions}>
              {browser.i18n.getMessage("load_more")}...
            </Button>
          </Flex>
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
  background-color: ${({ theme }) => theme.background};
  min-height: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  gap: 8px;
  min-height: 0;
  padding-bottom: 8px;

  & > * {
    flex-shrink: 0;
  }
`;
