import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { Loading, Text } from "@arconnect/components-rebrand";
import { useStorage } from "~utils/storage";

import { gql } from "~gateways/api";
import styled from "styled-components";
import {
  AO_RECEIVER_QUERY,
  AO_SENT_QUERY,
  AR_RECEIVER_QUERY,
  AR_SENT_QUERY,
  PRINT_ARWEAVE_QUERY
} from "~notifications/utils";
import { printTxWorkingGateways, txHistoryGateways } from "~gateways/gateway";
import { ViewAll } from "../Title";
import {
  getFormattedAmount,
  getFullMonthName,
  getTransactionDescription,
  groupTransactionsByMonth,
  processTransactions,
  sortFn,
  type ExtendedTransaction
} from "~lib/transactions";
import BigNumber from "bignumber.js";
import { retryWithDelay } from "~utils/promises/retry";
import { useLocation } from "~wallets/router/router.utils";
import arLogoLight from "url:/assets/ar/logo_light.png";
import { Logo } from "../Token";
import { getUserAvatar } from "~lib/avatar";

export default function Transactions() {
  const { navigate } = useLocation();
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        if (activeAddress) {
          const queries = [
            AR_RECEIVER_QUERY,
            AR_SENT_QUERY,
            AO_SENT_QUERY,
            AO_RECEIVER_QUERY,
            PRINT_ARWEAVE_QUERY
          ];

          const [
            rawReceived,
            rawSent,
            rawAoSent,
            rawAoReceived,
            rawPrintArchive
          ] = await Promise.allSettled(
            queries.map((query, index) =>
              retryWithDelay(async (attempt) => {
                const data = await gql(
                  query,
                  { address: activeAddress },
                  index !== 4
                    ? txHistoryGateways[attempt % txHistoryGateways.length]
                    : printTxWorkingGateways[
                        attempt % printTxWorkingGateways.length
                      ]
                );
                if (data?.data === null && (data as any)?.errors?.length > 0) {
                  throw new Error(
                    (data as any)?.errors?.[0]?.message || "GraphQL Error"
                  );
                }
                return data;
              }, 2)
            )
          );

          let sent = await processTransactions(rawSent, "sent");
          sent = sent.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
          let received = await processTransactions(rawReceived, "received");
          received = received.filter((tx) =>
            BigNumber(tx.node.quantity.ar).gt(0)
          );
          const aoSent = await processTransactions(rawAoSent, "aoSent", true);
          const aoReceived = await processTransactions(
            rawAoReceived,
            "aoReceived",
            true
          );
          const printArchive = await processTransactions(
            rawPrintArchive,
            "printArchive"
          );

          let combinedTransactions: ExtendedTransaction[] = [
            ...sent,
            ...received,
            ...aoReceived,
            ...aoSent,
            ...printArchive
          ];

          const seenIds = new Set<string>();
          combinedTransactions = combinedTransactions.filter((transaction) => {
            const id = transaction.node.id;
            if (seenIds.has(id)) {
              return false;
            }
            seenIds.add(id);
            return true;
          });

          combinedTransactions.sort(sortFn);

          combinedTransactions = combinedTransactions.map((transaction) => {
            if (transaction.node.block && transaction.node.block.timestamp) {
              const date = new Date(transaction.node.block.timestamp * 1000);
              const day = date.getDate();
              const month = date.getMonth() + 1;
              const year = date.getFullYear();
              return {
                ...transaction,
                day,
                month,
                year,
                date: date.toISOString()
              };
            } else {
              const now = new Date();
              return {
                ...transaction,
                day: now.getDate(),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                date: null
              };
            }
          });

          setTransactions(combinedTransactions);
        }
      } catch (error) {
        console.error("Error fetching transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [activeAddress]);

  const groupedTransactions = useMemo(() => {
    return groupTransactionsByMonth(transactions);
  }, [transactions]);

  const renderTransaction = (transaction: ExtendedTransaction) => {
    return (
      <TransactionItemComponent
        key={transaction.node.id}
        transaction={transaction}
      />
    );
  };

  return (
    <>
      <TransactionsWrapper>
        {!loading ? (
          transactions.length > 0 ? (
            <GroupedTransactions>
              {groupedTransactions.map((section) => (
                <SectionList key={section.title}>
                  <SectionTitle>{section.title.split(" ")[0]}</SectionTitle>
                  {section.data.map(renderTransaction)}
                </SectionList>
              ))}
            </GroupedTransactions>
          ) : (
            <NoTransactionsContainer>
              <NoTransactions>
                {browser.i18n.getMessage("no_transactions")}
              </NoTransactions>
            </NoTransactionsContainer>
          )
        ) : (
          <NoTransactionsContainer>
            <Loading style={{ width: "20px", height: "20px" }} />
          </NoTransactionsContainer>
        )}
      </TransactionsWrapper>
      {transactions.length > 0 && (
        <ViewAll onClick={() => navigate("/transactions")}>
          {browser.i18n.getMessage("view_all")} ({transactions.length})
        </ViewAll>
      )}
    </>
  );
}

export const TransactionItemComponent = ({
  transaction
}: {
  transaction: ExtendedTransaction;
}) => {
  const [logoSource, setLogoSource] = useState<string>();
  const { navigate } = useLocation();

  useEffect(() => {
    const fetchLogo = async () => {
      if (transaction.aoInfo?.logo) {
        const logo = await getUserAvatar(transaction.aoInfo.logo);
        setLogoSource(logo!);
      } else {
        setLogoSource(arLogoLight);
      }
    };

    fetchLogo();
  }, [transaction.aoInfo?.logo]);

  return (
    <TransactionItem>
      <Transaction
        onClick={() => navigate(`/transaction/${transaction.node.id}`)}
      >
        <FlexContainer>
          <Logo src={logoSource} alt="Token logo" />
          <Section>
            <Main>{getTransactionDescription(transaction)}</Main>
            <Secondary>
              {transaction.date
                ? `${getFullMonthName(
                    `${transaction.month}-${transaction.year}`
                  )} ${transaction.day}`
                : browser.i18n.getMessage("pending")}
            </Secondary>
          </Section>
        </FlexContainer>
        <Section alignRight>
          <Amount
            success={
              transaction.transactionType === "received" ||
              transaction.transactionType === "aoReceived"
            }
          >
            {transaction.transactionType === "sent" ||
            transaction.transactionType === "aoSent" ||
            transaction.transactionType === "printArchive"
              ? "-"
              : "+"}
            {getFormattedAmount(transaction)}
          </Amount>
        </Section>
      </Transaction>
    </TransactionItem>
  );
};

const GroupedTransactions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SectionTitle = styled(Text).attrs({
  weight: "medium",
  noMargin: true
})``;

const FlexContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NoTransactionsContainer = styled.div`
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const TransactionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
`;

const Main = styled(Text).attrs({
  noMargin: true,
  weight: "semibold"
})``;

const Secondary = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "sm",
  variant: "secondary"
})``;

const Amount = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "md"
})<{ success?: boolean }>`
  color: ${(props) =>
    props.success
      ? props.theme.success
      : props.theme.displayTheme === "light"
      ? "#121212"
      : "#EEEEEE"};
`;

const Transaction = styled.div`
  display: flex;
  cursor: pointer;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  gap: 1rem;
`;

const Section = styled.div<{ alignRight?: boolean }>`
  text-align: ${({ alignRight }) => (alignRight ? "right" : "left")};
`;

const TransactionItem = styled.div`
  position: relative;

  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
`;

const NoTransactions = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
