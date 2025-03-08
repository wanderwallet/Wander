import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "~utils/storage";
import { gql } from "~gateways/api";
import styled from "styled-components";
import { Empty, TitleMessage } from "../notifications";
import {
  AO_RECEIVER_QUERY_WITH_CURSOR,
  AO_SENT_QUERY_WITH_CURSOR,
  AR_RECEIVER_QUERY_WITH_CURSOR,
  AR_SENT_QUERY_WITH_CURSOR,
  PRINT_ARWEAVE_QUERY_WITH_CURSOR
} from "~notifications/utils";
import { printTxWorkingGateways, txHistoryGateways } from "~gateways/gateway";
import { Button, Loading } from "@arconnect/components-rebrand";
import type GQLResultInterface from "ar-gql/dist/faces";
import {
  sortFn,
  processTransactions,
  type GroupedTransactions,
  type ExtendedTransaction,
  getFullMonthNameWithYear
} from "~lib/transactions";
import BigNumber from "bignumber.js";
import { retryWithDelay } from "~utils/promises/retry";
import {
  TransactionItemComponent,
  SectionTitle,
  SectionList
} from "~components/popup/home/Transactions";

const defaultCursors = ["", "", "", "", ""];
const defaultHasNextPages = [true, true, true, true, true];

export function TransactionsView() {
  const [cursors, setCursors] = useState(defaultCursors);
  const [hasNextPages, setHasNextPages] = useState(defaultHasNextPages);
  const [transactions, setTransactions] = useState<GroupedTransactions>({});
  const [loading, setLoading] = useState(false);

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const hasNextPage = useMemo(
    () => hasNextPages.some((v) => v === true),
    [hasNextPages]
  );

  const fetchTransactions = async () => {
    try {
      if (!activeAddress) return;

      setLoading(true);

      const queries = [
        AR_RECEIVER_QUERY_WITH_CURSOR,
        AR_SENT_QUERY_WITH_CURSOR,
        AO_SENT_QUERY_WITH_CURSOR,
        AO_RECEIVER_QUERY_WITH_CURSOR,
        PRINT_ARWEAVE_QUERY_WITH_CURSOR
      ];

      const [rawReceived, rawSent, rawAoSent, rawAoReceived, rawPrintArchive] =
        await Promise.allSettled(
          queries.map((query, idx) => {
            return hasNextPages[idx]
              ? retryWithDelay(async (attempt) => {
                  const data = await gql(
                    query,
                    { address: activeAddress, after: cursors[idx] },
                    idx !== 4
                      ? txHistoryGateways[attempt % txHistoryGateways.length]
                      : printTxWorkingGateways[
                          attempt % printTxWorkingGateways.length
                        ]
                  );
                  if (
                    data?.data === null &&
                    (data as any)?.errors?.length > 0
                  ) {
                    throw new Error(
                      (data as any)?.errors?.[0]?.message || "GraphQL Error"
                    );
                  }
                  return data;
                }, 2)
              : ({
                  data: {
                    transactions: {
                      pageInfo: { hasNextPage: false },
                      edges: []
                    }
                  }
                } as GQLResultInterface);
          })
        );

      let sent = await processTransactions(rawSent, "sent");
      let received = await processTransactions(rawReceived, "received");
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

      setCursors((prev) =>
        [received, sent, aoSent, aoReceived, printArchive].map(
          (data, idx) => data[data.length - 1]?.cursor ?? prev[idx]
        )
      );

      sent = sent.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
      received = received.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));

      setHasNextPages(
        [rawReceived, rawSent, rawAoSent, rawAoReceived, rawPrintArchive].map(
          (result) =>
            (result.status === "fulfilled" &&
              result.value?.data?.transactions?.pageInfo?.hasNextPage) ??
            true
        )
      );

      let combinedTransactions: ExtendedTransaction[] = [
        ...sent,
        ...received,
        ...aoReceived,
        ...aoSent,
        ...printArchive
      ];

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

      const groupedTransactions = combinedTransactions.reduce(
        (acc, transaction) => {
          const monthYear = `${transaction.month}-${transaction.year}`;
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          if (!acc[monthYear].some((t) => t.node.id === transaction.node.id)) {
            acc[monthYear].push(transaction);
          }
          return acc;
        },
        transactions
      );

      // Get the month-year keys and sort them in descending order
      const sortedMonthYears = Object.keys(groupedTransactions).sort((a, b) => {
        const [monthA, yearA] = a.split("-").map(Number);
        const [monthB, yearB] = b.split("-").map(Number);

        // Sort by year first, then by month
        return yearB - yearA || monthB - monthA;
      });

      // Create a new object with sorted keys
      const sortedGroupedTransactions: GroupedTransactions =
        sortedMonthYears.reduce((acc, key) => {
          acc[key] = groupedTransactions[key].sort(sortFn);
          return acc;
        }, {});

      setTransactions(sortedGroupedTransactions);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCursors(defaultCursors);
    setHasNextPages(defaultHasNextPages);
    fetchTransactions();
  }, [activeAddress]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("activity")} />
      <TransactionsWrapper>
        {Object.keys(transactions).length > 0
          ? Object.keys(transactions).map((monthYear) => (
              <SectionList key={monthYear}>
                <SectionTitle>
                  {getFullMonthNameWithYear(monthYear)}
                </SectionTitle>
                <TransactionItem>
                  {transactions[monthYear].map((transaction) => (
                    <TransactionItemComponent
                      key={transaction.node.id}
                      transaction={transaction}
                    />
                  ))}
                </TransactionItem>
              </SectionList>
            ))
          : !loading && (
              <Empty>
                <TitleMessage>
                  {browser.i18n.getMessage("no_transactions")}
                </TitleMessage>
              </Empty>
            )}
        {hasNextPage && (
          <Button
            fullWidth
            disabled={!hasNextPage || loading}
            style={{ alignSelf: "center", marginTop: "5px" }}
            onClick={fetchTransactions}
          >
            {loading ? (
              <>
                Loading <Loading style={{ margin: "0.18rem" }} />
              </>
            ) : (
              "Load more..."
            )}
          </Button>
        )}
      </TransactionsWrapper>
    </>
  );
}

const TransactionsWrapper = styled.div`
  padding: 0px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled.div`
  gap: 8px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
`;
