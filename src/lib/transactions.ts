import type GQLResultInterface from "ar-gql/dist/faces";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import { formatAddress } from "~utils/format";
import BigNumber from "bignumber.js";
import browser from "webextension-polyfill";
import { balanceToFractioned, formatFiatBalance } from "~tokens/currency";
import { timeoutPromise } from "~utils/promises/timeout";
import { AF_ERROR_QUERY } from "~notifications/utils";
import { gql } from "~gateways/api";
import { txHistoryGateways } from "~gateways/gateway";
import { retryWithDelay } from "~utils/promises/retry";
import type {
  RawTransaction,
  Transaction
} from "~api/background/handlers/alarms/notifications/notifications-alarm.utils";
import { fetchTokenByProcessId } from "~tokens/aoTokens/ao";

const AGENT_TOKEN_ADDRESS = "8rbAftv7RaPxFjFk5FGUVAVCSjGQB4JHDcb9P9wCVhQ";

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
  date: ""
});

export async function checkTransactionError(
  transaction: GQLEdgeInterface | Transaction
): Promise<boolean> {
  if (transaction.node.recipient !== AGENT_TOKEN_ADDRESS) {
    return false;
  }

  return retryWithDelay(async (attempt) => {
    const data = await gql(
      AF_ERROR_QUERY,
      { messageId: transaction.node.id },
      txHistoryGateways[attempt % txHistoryGateways.length]
    );

    if (data?.data === null && (data as any)?.errors?.length > 0) {
      throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
    }

    return data.data.transactions.edges.length > 0;
  }, 2).catch(() => false);
}

const processAoTransaction = async (
  transaction: GQLEdgeInterface,
  type: string
) => {
  const hasError = await checkTransactionError(transaction);
  if (hasError) {
    return null;
  }

  const tokenData = await timeoutPromise(
    fetchTokenByProcessId(transaction.node.recipient),
    10000
  ).catch(() => null);
  const quantityTag = transaction.node.tags.find(
    (tag) => tag.name === "Quantity"
  );
  const isCollectible = tokenData?.type === "collectible";

  return {
    ...transaction,
    transactionType: type,
    day: 0,
    month: 0,
    year: 0,
    date: "",
    aoInfo: {
      quantity: quantityTag ? quantityTag.value : undefined,
      tickerName:
        (isCollectible
          ? tokenData?.Name! || tokenData?.Ticker!
          : tokenData?.Ticker! || tokenData?.Name!) ||
        formatAddress(transaction.node.recipient, 4),
      denomination: tokenData?.Denomination || 0,
      logo: tokenData?.Logo
    }
  };
};

export const processTransactions = async (
  rawData: PromiseSettledResult<GQLResultInterface>,
  type: string,
  isAo = false
): Promise<ExtendedTransaction[]> => {
  if (rawData.status === "fulfilled") {
    const edges = rawData.value?.data?.transactions?.edges || [];
    if (isAo) {
      return Promise.all(
        edges.map((transaction) => processAoTransaction(transaction, type))
      ).then((transactions) => transactions.filter(Boolean));
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
          divisibility: transaction.aoInfo.denomination
        })
          .toFixed(3)
          .replace(/\.?0+$/, "")} ${transaction.aoInfo.tickerName}`;
      }
      return "";
    case "printArchive":
      return `${parseFloat(transaction.node.fee.ar).toFixed(3)} AR`;
    default:
      return "";
  }
};

export const getFormattedFiatAmount = (
  transaction: ExtendedTransaction,
  arPrice: number,
  currency: string
) => {
  try {
    if (
      transaction.node.quantity &&
      transaction.transactionType !== "printArchive"
    ) {
      const fiatBalance = BigNumber(transaction.node.quantity.ar).multipliedBy(
        arPrice
      );
      return formatFiatBalance(fiatBalance, currency);
    } else if (
      transaction.node.fee &&
      transaction.transactionType === "printArchive"
    ) {
      const fiatBalance = BigNumber(transaction.node.fee.ar).multipliedBy(
        arPrice
      );
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
      return `${browser.i18n.getMessage("sent")} ${
        transaction.aoInfo.tickerName
      }`;
    case "aoReceived":
      return `${browser.i18n.getMessage("received")} ${
        transaction.aoInfo.tickerName
      }`;
    case "printArchive":
      return browser.i18n.getMessage("print_archived");
    default:
      return "";
  }
};

type DateFormatOptions = { month: "long"; year?: "numeric" };

const formatMonthYear = (
  monthYear: string,
  options: DateFormatOptions
): string => {
  const [month, year] = monthYear.split("-").map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleString("default", options);
};

export const getFullMonthName = (monthYear: string) => {
  return formatMonthYear(monthYear, { month: "long" });
};

export const getFullMonthNameWithYear = (monthYear: string) => {
  return formatMonthYear(monthYear, { month: "long", year: "numeric" });
};

export const groupTransactionsByMonth = (
  transactions: ExtendedTransaction[]
): GroupedTransactionsByMonth[] => {
  const groups = transactions.reduce((acc, transaction) => {
    const monthYear = `${transaction.month}-${transaction.year}`;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(transaction);
    return acc;
  }, {} as Record<string, ExtendedTransaction[]>);

  return Object.entries(groups)
    .map(([monthYear, transactions]) => {
      const [month, year] = monthYear.split("-").map(Number);
      return {
        title: getFullMonthNameWithYear(monthYear),
        data: transactions,
        month,
        year
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .map(({ title, data }) => ({ title, data }));
};
