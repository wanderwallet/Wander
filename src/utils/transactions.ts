/**
 * Utility functions for AO/AR transactions
 */

import { hasTransferError, sortFn, type ExtendedTransaction } from "~lib/transactions";
import { getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import type { GQLNodeInterface } from "ar-gql/dist/faces";
import { createStorageArray } from "~utils/storage/storage.array";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import type Transaction from "arweave/web/lib/transaction";
import type { Tag } from "arweave/web/lib/transaction";
import { arweave } from "./agents/utils";
import { log, LOG_GROUP } from "./log/log.utils";
import { balanceToFractioned } from "~tokens/currency";
import BigNumber from "bignumber.js";

const pendingTransactionsMap = new Map<string, ExtendedTransaction[]>();

export interface PendingTransaction {
  id: string;
  address: string;
  transaction: ExtendedTransaction;
  createdAt: number;
}

/**
 * Storage array for pending transactions
 * Uses id for uniqueness
 */
export const pendingTransactionsArray = createStorageArray<PendingTransaction>("pending_transactions", {
  preventDuplicates: true,
  uniqueKey: "id",
});

/**
 * Save a pending transaction to extension storage
 * This will keep the transaction visible until it's fetched from GraphQL
 */
export async function savePendingTransaction(address: string, transaction: ExtendedTransaction): Promise<void> {
  try {
    const pendingTx: PendingTransaction = {
      id: transaction.node.id,
      address,
      transaction,
      createdAt: Date.now(),
    };

    const existing = await pendingTransactionsArray.find((pt) => pt.id === transaction.node.id);

    if (existing) {
      await pendingTransactionsArray.updateWhere(
        (pt) => pt.id === transaction.node.id,
        () => pendingTx,
      );
    } else {
      await pendingTransactionsArray.push(pendingTx);
    }
  } catch (error) {
    console.error("Error saving pending transaction:", error);
  }
}

/**
 * Get all pending transactions for an address
 */
export async function getPendingTransactions(address: string): Promise<ExtendedTransaction[]> {
  try {
    const validPending: ExtendedTransaction[] = [];
    const transactions = await pendingTransactionsArray.getAll();
    for (const pt of transactions) {
      if (pt.address === address) {
        validPending.push(pt.transaction);
      } else if (pt.transaction.node.recipient === address || pt.transaction.aoInfo?.recipient === address) {
        const tx: ExtendedTransaction = {
          ...pt.transaction,
          transactionType: pt.transaction.aoInfo ? "aoReceived" : "received",
        };
        validPending.push(tx);
      }
    }

    return validPending;
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error getting pending transactions:", error);
    return [];
  }
}

export async function getPendingTokenTransactions(address: string, tokenId: string): Promise<ExtendedTransaction[]> {
  try {
    const validPending: ExtendedTransaction[] = [];
    const transactions = await pendingTransactionsArray.getAll();
    for (const pt of transactions) {
      const isTokenTransaction =
        tokenId === AR_PROCESS_ID ? +pt.transaction.node.quantity.ar > 0 : pt.transaction.node.recipient === tokenId;
      if (isTokenTransaction) {
        if (pt.address === address) {
          validPending.push(pt.transaction);
        } else if (pt.transaction.node.recipient === address || pt.transaction.aoInfo?.recipient === address) {
          const tx: ExtendedTransaction = {
            ...pt.transaction,
            transactionType: pt.transaction.aoInfo ? "aoReceived" : "received",
          };
          validPending.push(tx);
        }
      }
    }

    return validPending;
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error getting pending token transactions:", error);
    return [];
  }
}

/**
 * Get a pending transaction by id
 */
export async function getPendingTransaction(id: string): Promise<GQLNodeInterface | undefined> {
  try {
    const pending = await pendingTransactionsArray.find((pt) => pt.id === id);
    return pending?.transaction?.node as unknown as GQLNodeInterface;
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error getting pending transaction by id:", error);
    return undefined;
  }
}

/**
 * Remove pending transactions that are now available in GraphQL
 */
export async function removePendingTransactions(transactionIds: string[]): Promise<void> {
  try {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const idsSet = new Set(transactionIds);
    await pendingTransactionsArray.removeWhere((pt) => idsSet.has(pt.id) && pt.createdAt <= fiveMinutesAgo);
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error removing pending transactions:", error);
  }
}

/**
 * Clean up old pending transactions (older than 24 hours)
 */
export async function cleanupOldPendingTransactions(): Promise<void> {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    await pendingTransactionsArray.removeWhere((pt) => pt.createdAt <= oneDayAgo);
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error cleaning up old pending transactions:", error);
  }
}

/**
 * Create an Transaction from AR transaction data
 */
export async function createArPendingTransaction(
  transaction: Transaction,
  ownerAddress: string,
  transactionType: "sent" | "received" = "sent",
): Promise<void> {
  try {
    const now = new Date();
    const tags = (transaction.get("tags") as unknown as Tag[]).map((tag) => ({
      name: tag.get("name", { string: true, decode: true }),
      value: tag.get("value", { string: true, decode: true }),
    }));
    const tx: ExtendedTransaction = {
      node: {
        id: transaction.id,
        recipient: transaction.target,
        owner: { address: ownerAddress },
        quantity: { ar: arweave.ar.winstonToAr(transaction.quantity) },
        fee: { ar: arweave.ar.winstonToAr(transaction.reward) },
        data: { size: transaction.data_size },
        ingested_at: Math.floor(now.getTime() / 1000),
        tags,
      },
      cursor: "",
      transactionType,
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      date: null, // Will be set when fetched from GraphQL
    };

    await savePendingTransaction(ownerAddress, tx);
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error creating AR pending transaction:", error);
  }
}

/**
 * Create an Transaction from AO transaction data
 */
export async function createAoPendingTransaction(
  txId: string,
  ownerAddress: string,
  recipient: string,
  quantity: string,
  tokenId: string,
  tokenInfo?: TokenInfo,
  message?: string,
  tags: Array<{ name: string; value: string }> = [],
  transactionType: "aoSent" | "aoReceived" = "aoSent",
): Promise<void> {
  try {
    tokenInfo = tokenInfo || (JSON.parse(getTagValue("X-Token-In", tags) || "{}") as TokenInfo);
    const now = new Date();

    const tagMap = new Map<string, string>([
      ["Data-Protocol", "ao"],
      ["Action", "Transfer"],
      ["Token", tokenId],
      ["Token-Address", tokenId],
      ["Recipient", recipient],
      ["Quantity", quantity],
      ...(tokenInfo.Ticker ? [["Ticker", tokenInfo.Ticker] as [string, string]] : []),
      ...tags.map((tag) => [tag.name, tag.value] as [string, string]),
    ]);

    const aoTags = Array.from(tagMap, ([name, value]) => ({ name, value }));

    const tx: ExtendedTransaction = {
      node: {
        id: txId,
        recipient: tokenId,
        owner: { address: ownerAddress },
        quantity: { ar: "0" },
        fee: { ar: "0" },
        data: {
          size: message ? new TextEncoder().encode(message).length.toString() : "0",
        },
        tags: aoTags,
        ingested_at: Math.floor(now.getTime() / 1000),
      },
      cursor: "",
      transactionType,
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      date: null, // Will be set when fetched from GraphQL
      aoInfo: {
        tickerName: tokenInfo.Ticker,
        quantity,
        recipient,
        denomination: tokenInfo.Denomination,
        logo: tokenInfo.Logo,
      },
    };

    await savePendingTransaction(ownerAddress, tx);
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error creating AO pending transaction:", error);
  }
}

export async function mergeWithPending(
  baseTransactions: ExtendedTransaction[],
  pendingTransactions: ExtendedTransaction[],
  cleanUp: boolean = false,
): Promise<ExtendedTransaction[]> {
  const graphqlTxIds = new Set(baseTransactions.map((tx) => tx.node.id));
  const newPendingTxs = pendingTransactions.filter((tx) => !graphqlTxIds.has(tx.node.id));

  // Remove pending transactions that are now available in GraphQL
  if (cleanUp && graphqlTxIds.size > 0) {
    await removePendingTransactions(Array.from(graphqlTxIds));
  }

  return [...newPendingTxs, ...baseTransactions].sort(sortFn);
}

export async function removeTransferErrorTransactions(
  transactions: ExtendedTransaction[],
): Promise<ExtendedTransaction[]> {
  const transferErrorIds: string[] = [];
  const validTxs: ExtendedTransaction[] = [];

  for (const tx of transactions) {
    if (hasTransferError(tx.node.id)) {
      transferErrorIds.push(tx.node.id);
    } else {
      validTxs.push(tx);
    }
  }

  if (transferErrorIds.length > 0) {
    await removePendingTransactions(transferErrorIds);
  }

  return validTxs;
}

// For tokens purposes only
export async function setPendingTransactionsMap(): Promise<void> {
  pendingTransactionsMap.clear();
  const transactions = await pendingTransactionsArray.getAll();
  for (const tx of transactions) {
    if (tx.transaction.aoInfo) {
      const tokenId = tx.transaction.node.recipient;
      if (!pendingTransactionsMap.has(tokenId)) {
        pendingTransactionsMap.set(tokenId, []);
      }
      pendingTransactionsMap.get(tokenId).push(tx.transaction);
    } else {
      if (!pendingTransactionsMap.has(AR_PROCESS_ID)) {
        pendingTransactionsMap.set(AR_PROCESS_ID, []);
      }
      pendingTransactionsMap.get(AR_PROCESS_ID).push(tx.transaction);
    }
  }
  log(LOG_GROUP.TRANSACTIONS, "Pending transactions map set:", pendingTransactionsMap);
}

export function getTokenPendingTransactionsStats(
  tokenId: string,
  denomination: number,
): { count: number; balance: string } {
  const transactions = pendingTransactionsMap.get(tokenId) || [];
  const count = transactions.length;
  const isAr = tokenId === AR_PROCESS_ID;
  const quantity = transactions.reduce(
    (acc, tx) => acc.plus(isAr ? tx.node.quantity.ar : tx.aoInfo?.quantity || "0"),
    new BigNumber(0),
  );
  const balance = isAr ? quantity.toFixed() : balanceToFractioned(quantity.toString(), denomination).toFixed();
  return { count, balance };
}
