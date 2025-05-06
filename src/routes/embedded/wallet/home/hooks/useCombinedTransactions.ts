import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { gql } from "~gateways/api";
import { printTxWorkingGateways, txHistoryGateways } from "~gateways/gateway";
import { groupTransactionsByMonth, sortFn, type ExtendedTransaction } from "~lib/transactions";
import {
  AO_RECEIVER_QUERY,
  AO_SENT_QUERY,
  AR_RECEIVER_QUERY,
  AR_SENT_QUERY,
  PRINT_ARWEAVE_QUERY,
  processTransactions,
} from "~notifications/utils";
import { retryWithDelay } from "~utils/promises/retry";
import { ExtensionStorage, useStorage } from "~utils/storage";

export function useCombinedTransactions() {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        if (activeAddress) {
          const queries = [AR_RECEIVER_QUERY, AR_SENT_QUERY, AO_SENT_QUERY, AO_RECEIVER_QUERY, PRINT_ARWEAVE_QUERY];

          const [rawReceived, rawSent, rawAoSent, rawAoReceived, rawPrintArchive] = await Promise.allSettled(
            queries.map((query, index) =>
              retryWithDelay(async (attempt) => {
                const data = await gql(
                  query,
                  { address: activeAddress },
                  index !== 4
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

          let sent = await processTransactions(rawSent, "sent");
          sent = sent.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
          let received = await processTransactions(rawReceived, "received");
          received = received.filter((tx) => BigNumber(tx.node.quantity.ar).gt(0));
          const aoSent = await processTransactions(rawAoSent, "aoSent", true);
          const aoReceived = await processTransactions(rawAoReceived, "aoReceived", true);
          const printArchive = await processTransactions(rawPrintArchive, "printArchive");

          let combinedTransactions: ExtendedTransaction[] = [
            ...sent,
            ...received,
            ...aoReceived,
            ...aoSent,
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
                date: date.toISOString(),
              };
            } else {
              const now = new Date();
              return {
                ...transaction,
                day: now.getDate(),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                date: null,
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

  return { transactions, loading, groupedTransactions };
}
