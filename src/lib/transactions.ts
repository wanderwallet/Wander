import type GQLResultInterface from "ar-gql/dist/faces";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import { formatAddress } from "~utils/format";
import BigNumber from "bignumber.js";
import browser from "webextension-polyfill";
import { balanceToFractioned, formatFiatBalance } from "~tokens/currency";
import { timeoutPromise } from "~utils/promises/timeout";
import { TRANSFER_ERROR_QUERY } from "~notifications/utils";
import { gql } from "~gateways/api";
import { txHistoryGateways } from "~gateways/gateway";
import { retryWithDelay } from "~utils/promises/retry";
import type { RawTransaction } from "~api/background/handlers/alarms/notifications/notifications-alarm.utils";
import { fetchTokenByProcessId, getTagValue, getTagValues } from "~tokens/aoTokens/ao";
import type { Announcement } from "~utils/announcements";
import { log, LOG_GROUP } from "~utils/log/log.utils";

const transactionErrorMap = new Map<string, boolean>();

export type ExtendedTransaction = RawTransaction & {
  cursor: string;
  month: number;
  year: number;
  transactionType: string;
  date: string | null;
  day: number;
  aoInfo?: {
    tickerName: string;
    denomination?: number;
    quantity: string;
    logo?: string;
  };
  announcementData?: Announcement;
};

export type GroupedTransactions = {
  [key: string]: ExtendedTransaction[];
};

export interface GroupedTransactionsByMonth {
  title: string;
  data: ExtendedTransaction[];
}

export function sortFn(a: ExtendedTransaction, b: ExtendedTransaction) {
  const timestampA = a.node?.block?.timestamp || Number.MAX_SAFE_INTEGER;
  const timestampB = b.node?.block?.timestamp || Number.MAX_SAFE_INTEGER;
  return timestampB - timestampA;
}

const processTransaction = (transaction: GQLEdgeInterface, type: string) => ({
  ...transaction,
  transactionType: type,
  day: 0,
  month: 0,
  year: 0,
  date: "",
});

export async function checkTransferStatus(transactions: GQLEdgeInterface[]): Promise<void> {
  try {
    const uncheckedIds = transactions
      .filter((tx) => {
        if (transactionErrorMap.has(tx.node.id)) return false;
        const [protocol, action] = getTagValues(["Data-Protocol", "Action"], tx.node.tags || []);
        return protocol === "ao" && action === "Transfer";
      })
      .map((tx) => tx.node.id);
    if (uncheckedIds.length === 0) return;

    const batchSize = 100;
    const batchPromises: Promise<void>[] = [];

    for (let i = 0; i < uncheckedIds.length; i += batchSize) {
      const batch = uncheckedIds.slice(i, i + batchSize);

      const batchPromise = retryWithDelay(async (attempt) => {
        const data = await gql(
          TRANSFER_ERROR_QUERY,
          { messageIds: batch, sort: "INGESTED_AT_DESC" },
          txHistoryGateways[attempt % txHistoryGateways.length],
        );

        if (data?.data === null && (data as any)?.errors?.length > 0) {
          throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
        }

        const edges = data.data.transactions.edges;

        if (edges.length > 0) {
          const errorIdSet = new Set(
            edges
              .map((edge) => {
                const tags = edge.node.tags || [];
                return getTagValue("Pushed-For", tags) || getTagValue("Message-Id", tags);
              })
              .filter(Boolean),
          );

          for (const id of batch) {
            transactionErrorMap.set(id, errorIdSet.has(id));
          }
        } else {
          // Mark all as successful if no errors found
          for (const id of batch) {
            transactionErrorMap.set(id, false);
          }
        }
      }, 2).catch(() => {
        // On error, mark all batch IDs as false (assume no error)
        for (const id of batch) {
          transactionErrorMap.set(id, false);
        }
      });

      batchPromises.push(batchPromise);
    }

    // Wait for all batches to complete in parallel
    await Promise.all(batchPromises);
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error checking transfer transactions status", error);
  }
}

const processAoTransaction = async (transaction: GQLEdgeInterface, type: string) => {
  const hasError = transactionErrorMap.get(transaction.node.id);
  if (hasError) return null;

  const tags = transaction.node.tags || [];
  const isLiquidOpsAoReceived = type === "liquidOpsAoReceived";
  const processId = isLiquidOpsAoReceived ? getTagValue("From-Process", tags) : transaction.node.recipient;
  const tokenData = await timeoutPromise(fetchTokenByProcessId(processId), 10000).catch(() => null);
  const quantity = getTagValue("Quantity", tags) || getTagValue("Mint-Quantity", tags);
  const isCollectible = tokenData?.type === "collectible";

  return {
    ...transaction,
    transactionType: isLiquidOpsAoReceived ? "aoReceived" : type,
    day: 0,
    month: 0,
    year: 0,
    date: "",
    aoInfo: {
      quantity: quantity ? quantity : undefined,
      tickerName:
        (isCollectible ? tokenData?.Name! || tokenData?.Ticker! : tokenData?.Ticker! || tokenData?.Name!) ||
        formatAddress(processId, 4),
      denomination: tokenData?.Denomination || 0,
      logo: tokenData?.Logo,
    },
  };
};

export const processTransactions = async (
  rawData: PromiseSettledResult<GQLResultInterface>,
  type: string,
  isAo = false,
): Promise<ExtendedTransaction[]> => {
  if (rawData.status === "fulfilled") {
    const edges = rawData.value?.data?.transactions?.edges || [];
    if (isAo) {
      return Promise.all(edges.map((transaction) => processAoTransaction(transaction, type))).then((transactions) =>
        transactions.filter(Boolean),
      );
    } else {
      return edges.map((transaction) => processTransaction(transaction, type));
    }
  } else {
    return Promise.resolve([]);
  }
};

export const getFormattedAmount = (transaction: ExtendedTransaction) => {
  switch (transaction.transactionType) {
    case "sent":
    case "received":
      return `${parseFloat(transaction.node.quantity.ar)
        .toFixed(3)
        .replace(/\.?0+$/, "")} AR`;
    case "aoSent":
    case "aoReceived":
      if (transaction.aoInfo) {
        return `${balanceToFractioned(transaction.aoInfo.quantity, {
          divisibility: transaction.aoInfo.denomination,
        })
          .toFixed(3)
          .replace(/\.?0+$/, "")} ${transaction.aoInfo.tickerName}`;
      }
      return "";
    case "printArchive":
      return `${parseFloat(transaction.node.fee?.ar || "0").toFixed(3)} AR`;
    case "announcement":
      return ""; // Announcements don't have amounts
    default:
      return "";
  }
};

export const getFormattedFiatAmount = (transaction: ExtendedTransaction, arPrice: number, currency: string) => {
  try {
    if (
      transaction.node.quantity &&
      transaction.transactionType !== "printArchive" &&
      transaction.transactionType !== "announcement"
    ) {
      const fiatBalance = BigNumber(transaction.node.quantity.ar).multipliedBy(arPrice);
      return formatFiatBalance(fiatBalance, currency);
    } else if (transaction.node.fee && transaction.transactionType === "printArchive") {
      const fiatBalance = BigNumber(transaction.node.fee?.ar || "0").multipliedBy(arPrice);
      return formatFiatBalance(fiatBalance, currency);
    }
  } catch {}
  return "";
};

export const getTransactionDescription = (transaction: ExtendedTransaction) => {
  switch (transaction.transactionType) {
    case "sent":
      return `${browser.i18n.getMessage("sent")} AR`;
    case "received":
      return `${browser.i18n.getMessage("received")} AR`;
    case "aoSent":
      return `${browser.i18n.getMessage("sent")} ${transaction.aoInfo.tickerName}`;
    case "aoReceived":
      return `${browser.i18n.getMessage("received")} ${transaction.aoInfo.tickerName}`;
    case "printArchive":
      return browser.i18n.getMessage("print_archived");
    case "announcement":
      return (transaction as any).announcementData?.title || "Announcement";
    default:
      return "";
  }
};

type DateFormatOptions = { month: "long" | "short"; year?: "numeric" };

const formatMonthYear = (monthYear: string, options: DateFormatOptions): string => {
  const [month, year] = monthYear.split("-").map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleString("default", options);
};

export const getMonthName = (monthYear: string, monthType: DateFormatOptions["month"] = "long") => {
  return formatMonthYear(monthYear, { month: monthType });
};

export const getFullMonthNameWithYear = (monthYear: string) => {
  return formatMonthYear(monthYear, { month: "long", year: "numeric" });
};

export const groupTransactionsByMonth = (transactions: ExtendedTransaction[]): GroupedTransactionsByMonth[] => {
  const groups = transactions.reduce(
    (acc, transaction) => {
      const monthYear = `${transaction.month}-${transaction.year}`;
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(transaction);
      return acc;
    },
    {} as Record<string, ExtendedTransaction[]>,
  );

  return Object.entries(groups)
    .map(([monthYear, transactions]) => {
      const [month, year] = monthYear.split("-").map(Number);
      return {
        title: getFullMonthNameWithYear(monthYear),
        data: transactions,
        month,
        year,
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .map(({ title, data }) => ({ title, data }));
};
