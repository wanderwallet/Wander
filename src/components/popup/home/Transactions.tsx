import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { Loading, Text } from "@wanderapp/components";
import { useStorage } from "~utils/storage";
import { gql } from "~gateways/api";
import styled from "styled-components";
import {
  AO_LIQUIDOPS_RECEIVER_QUERY,
  AO_RECEIVER_QUERY,
  AO_SENT_QUERY,
  AR_RECEIVER_QUERY,
  AR_SENT_QUERY,
  PRINT_ARWEAVE_QUERY,
} from "~notifications/utils";
import { printTxWorkingGateways, txHistoryGateways } from "~gateways/gateway";
import { ViewAll } from "../Title";
import {
  checkTransferStatus,
  getFormattedAmount,
  getMonthName,
  getTransactionDescription,
  groupTransactionsByMonth,
  processTransactions,
  type ExtendedTransaction,
} from "~lib/transactions";
import {
  getPendingTransactions,
  cleanupOldPendingTransactions,
  mergeWithPending,
  removeTransferErrorTransactions,
} from "~utils/transactions/pending/pending.utils";
import BigNumber from "bignumber.js";
import { retryWithDelay } from "~utils/promises/retry";
import { useLocation } from "~wallets/router/router.utils";
import { convertAnnouncementsToTransactions } from "~utils/announcements";
import { Announcement01 } from "@untitled-ui/icons-react";
import { Flex } from "~components/common/Flex";
import dayjs from "dayjs";
import { ParseTextWithLinks } from "~components/common/ParseTextWithLinks";
import { TokenLogo } from "~components/popup/TokenLogo";

interface TransactionsCache {
  transactions: ExtendedTransaction[];
  timestamp: number;
  address: string;
}

export default function Transactions() {
  const { navigate } = useLocation();
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const [transactionsCache, setTransactionsCache] = useStorage<TransactionsCache | null>({
    key: "transactions_cache",
    instance: ExtensionStorage,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      let cacheShown = false;
      try {
        if (activeAddress) {
          await cleanupOldPendingTransactions();

          const queries = [
            AR_RECEIVER_QUERY,
            AR_SENT_QUERY,
            AO_SENT_QUERY,
            AO_RECEIVER_QUERY,
            AO_LIQUIDOPS_RECEIVER_QUERY,
            PRINT_ARWEAVE_QUERY,
          ];

          // Show cache immediately if GraphQL is slow (after 2 seconds)
          let graphqlCompleted = false;

          const showCacheIfAvailable = async () => {
            if (!cacheShown && transactionsCache && transactionsCache.address === activeAddress) {
              cacheShown = true;
              const pendingTransactions = await getPendingTransactions(activeAddress);
              const merged = await mergeWithPending(transactionsCache.transactions, pendingTransactions);
              setTransactions(merged);
              setLoading(false);
            }
          };

          // Start timeout to show cache if GraphQL is slow
          const cacheTimeout = setTimeout(async () => {
            if (!graphqlCompleted) {
              await showCacheIfAvailable();
              clearTimeout(cacheTimeout);
            }
          }, 2000);

          const [rawReceived, rawSent, rawAoSent, rawAoReceived, rawLiquidOpsAoReceived, rawPrintArchive] =
            await Promise.allSettled(
              queries.map((query, index) =>
                retryWithDelay(async (attempt) => {
                  const data = await gql(
                    query,
                    { address: activeAddress, sort: "INGESTED_AT_DESC" },
                    index !== 5
                      ? txHistoryGateways[attempt % txHistoryGateways.length]
                      : printTxWorkingGateways[attempt % printTxWorkingGateways.length],
                  );
                  if (data?.data === null && (data as any)?.errors?.length > 0) {
                    throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
                  }
                  return data;
                }, 2),
              ),
            );

          graphqlCompleted = true;
          clearTimeout(cacheTimeout);

          // Check if all queries failed - if so, use cache as fallback
          const allFailed =
            rawReceived.status === "rejected" &&
            rawSent.status === "rejected" &&
            rawAoSent.status === "rejected" &&
            rawAoReceived.status === "rejected" &&
            rawLiquidOpsAoReceived.status === "rejected" &&
            rawPrintArchive.status === "rejected";

          if (allFailed && !cacheShown) {
            await showCacheIfAvailable();
            return;
          }

          // Process successful GraphQL results
          let pendingTransactions = await getPendingTransactions(activeAddress);
          const aoTransactions = [
            ...(rawAoSent.status === "fulfilled" ? rawAoSent.value?.data?.transactions?.edges || [] : []),
            ...(rawAoReceived.status === "fulfilled" ? rawAoReceived.value?.data?.transactions?.edges || [] : []),
            ...(pendingTransactions as any[]),
          ];
          await checkTransferStatus(aoTransactions);

          let sent = await processTransactions(rawSent, "sent");
          sent = sent.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
          let received = await processTransactions(rawReceived, "received");
          received = received.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
          const aoSent = await processTransactions(rawAoSent, "aoSent", true);
          const aoReceived = await processTransactions(rawAoReceived, "aoReceived", true);
          const liquidOpsAoReceived = await processTransactions(rawLiquidOpsAoReceived, "liquidOpsAoReceived", true);
          const printArchive = await processTransactions(rawPrintArchive, "printArchive");

          let combinedTransactions: ExtendedTransaction[] = [
            ...sent,
            ...received,
            ...aoReceived,
            ...aoSent,
            ...liquidOpsAoReceived,
            ...printArchive,
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

          const announcementTransactions = convertAnnouncementsToTransactions();
          combinedTransactions = [...combinedTransactions, ...announcementTransactions];

          const now = new Date();
          combinedTransactions = combinedTransactions.map((transaction) => {
            const timestamp = transaction.node.block?.timestamp;
            const date = timestamp ? new Date(timestamp * 1000) : now;

            return {
              ...transaction,
              day: date.getDate(),
              month: date.getMonth() + 1,
              year: date.getFullYear(),
              date: timestamp ? date.toISOString() : null,
            };
          });

          // Get pending transactions and merge with GraphQL results
          pendingTransactions = await removeTransferErrorTransactions(pendingTransactions);
          combinedTransactions = await mergeWithPending(combinedTransactions, pendingTransactions);

          setTransactions(combinedTransactions);

          const cacheData: TransactionsCache = {
            transactions: combinedTransactions,
            timestamp: Date.now(),
            address: activeAddress,
          };

          setTransactionsCache(cacheData);
        }
      } catch (error) {
        console.error("Error fetching transactions", error);
        // On error, try to use cache as fallback if not already shown
        if (!cacheShown && transactionsCache && transactionsCache.address === activeAddress) {
          const pendingTransactions = await getPendingTransactions(activeAddress);
          const merged = await mergeWithPending(transactionsCache.transactions, pendingTransactions);
          setTransactions(merged);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [activeAddress]);

  const groupedTransactions = useMemo(() => {
    return groupTransactionsByMonth(transactions.slice(0, 20));
  }, [transactions]);

  const renderTransaction = (transaction: ExtendedTransaction) => {
    const TransactionComponent =
      transaction.transactionType === "announcement" ? AnnouncementItemComponent : TransactionItemComponent;
    return <TransactionComponent key={transaction.node.id} transaction={transaction} />;
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
              <NoTransactions>{browser.i18n.getMessage("no_transactions")}</NoTransactions>
            </NoTransactionsContainer>
          )
        ) : (
          <NoTransactionsContainer>
            <Loading style={{ width: "20px", height: "20px" }} />
          </NoTransactionsContainer>
        )}
      </TransactionsWrapper>
      {!loading && transactions.length > 0 && (
        <ViewAll onClick={() => navigate("/transactions")}>
          {browser.i18n.getMessage("view_all")} ({transactions.length})
        </ViewAll>
      )}
    </>
  );
}

export const TransactionItemComponent = ({ transaction }: { transaction: ExtendedTransaction }) => {
  const { navigate } = useLocation();

  return (
    <TransactionItem showBackground={true}>
      <Transaction onClick={() => navigate(`/transaction/${transaction.node.id}`)}>
        <FlexContainer>
          <TokenLogo
            token={transaction.aoInfo?.logo || "AR"}
            name={transaction.aoInfo?.tickerName}
            style={{ flex: "1 0 auto" }}
          />
          <Section>
            <Main>{getTransactionDescription(transaction)}</Main>
            <Secondary>
              {transaction.date
                ? `${getMonthName(`${transaction.month}-${transaction.year}`)} ${transaction.day}`
                : browser.i18n.getMessage("pending")}
            </Secondary>
          </Section>
        </FlexContainer>
        <Section alignRight>
          <Amount success={transaction.transactionType === "received" || transaction.transactionType === "aoReceived"}>
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

export const AnnouncementItemComponent = ({ transaction }: { transaction: ExtendedTransaction }) => {
  const { navigate } = useLocation();

  return (
    <TransactionItem showBackground={true}>
      <Transaction onClick={() => navigate(`/announcement/${transaction.node.id}`)}>
        <Flex direction="column" gap={8} width="100%">
          <Flex direction="row" gap={4} align="center" justify="space-between" width="100%">
            <Flex direction="row" gap={4} align="center">
              <AnnouncementIconWrapper>
                <AnnouncementIcon />
              </AnnouncementIconWrapper>
              <Main style={{ whiteSpace: "nowrap" }}>{getTransactionDescription(transaction)}</Main>
            </Flex>
            <Secondary style={{ whiteSpace: "nowrap" }}>
              {`${getMonthName(`${transaction.month}-${transaction.year}`, "short")} ${transaction.day}`}
            </Secondary>
          </Flex>
          <Secondary
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              // width: "320px",
            }}>
            <ParseTextWithLinks text={transaction?.announcementData?.description || ""} />
          </Secondary>
        </Flex>
      </Transaction>
    </TransactionItem>
  );
};

export const TierTransactionItemComponent = ({ transaction }: { transaction: ExtendedTransaction }) => {
  const { navigate } = useLocation();

  return (
    <TransactionItem showBackground={false}>
      <Transaction padding="8px" onClick={() => navigate(`/transaction/${transaction.node.id}?back=/tier`)}>
        <FlexContainer>
          <TokenLogo
            style={{ flexShrink: 0 }}
            token={transaction.aoInfo?.logo || "AR"}
            name={transaction.aoInfo?.tickerName}
          />
          <Section>
            <Main>{getTransactionDescription(transaction)}</Main>
            <Secondary>
              {transaction.date ? dayjs(transaction.date).format("MMM D, YYYY") : browser.i18n.getMessage("pending")}
            </Secondary>
          </Section>
        </FlexContainer>
        <Section alignRight>
          <Amount success={transaction.transactionType === "received" || transaction.transactionType === "aoReceived"}>
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
  noMargin: true,
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
  weight: "semibold",
})``;

const Secondary = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "sm",
  variant: "secondary",
})``;

const Amount = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "md",
})<{ success?: boolean }>`
  color: ${(props) =>
    props.success ? props.theme.success : props.theme.displayTheme === "light" ? "#121212" : "#EEEEEE"};
`;

const Transaction = styled.div<{ padding?: string }>`
  display: flex;
  cursor: pointer;
  justify-content: space-between;
  align-items: center;
  padding: ${({ padding }) => padding ?? "12px"};
  gap: 1rem;
  align-self: stretch;
`;

const Section = styled.div<{ alignRight?: boolean }>`
  text-align: ${({ alignRight }) => (alignRight ? "right" : "left")};
`;

const TransactionItem = styled.div<{ showBackground?: boolean }>`
  position: relative;
  background: ${({ theme, showBackground }) => (showBackground ? theme.surfaceSecondary : "transparent")};
  border-radius: 8px;

  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }

  &:hover {
    background: ${({ theme }) => theme.surfaceTertiary};
  }
`;

const NoTransactions = styled(Text).attrs({
  noMargin: true,
})`
  text-align: center;
`;

const AnnouncementIconWrapper = styled.div`
  display: flex;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  border-radius: 50px;
  background: ${({ theme }) => theme.surfaceDefault};
`;

const AnnouncementIcon = styled(Announcement01)`
  height: 12px;
  width: 12px;
  color: ${({ theme }) => theme.theme};
`;

const AnnouncementLink = styled.a`
  color: ${({ theme }) => theme.theme};
  text-decoration: none;
  display: inline;
`;
