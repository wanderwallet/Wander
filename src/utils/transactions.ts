/**
 * Utility functions for AO/AR transactions
 */

import type { ExtendedTransaction } from "~lib/transactions";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import type { GQLNodeInterface } from "ar-gql/dist/faces";
import { createStorageArray } from "~utils/storage/storage.array";

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
    const pending = await pendingTransactionsArray.filter((pt) => pt.address === address);
    return pending.map((pt) => pt.transaction);
  } catch (error) {
    console.error("Error getting pending transactions:", error);
    return [];
  }
}

export async function getPendingTokenTransactions(address: string, tokenId: string): Promise<ExtendedTransaction[]> {
  try {
    const pending = await pendingTransactionsArray.filter(
      (pt) => pt.address === address && pt.transaction.node.recipient === tokenId,
    );
    return pending.map((pt) => pt.transaction);
  } catch (error) {
    console.error("Error getting pending token transactions:", error);
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
    console.error("Error getting pending transaction by id:", error);
    return undefined;
  }
}

/**
 * Remove pending transactions that are now available in GraphQL
 */
export async function removePendingTransactions(transactionIds: string[]): Promise<void> {
  try {
    const idsSet = new Set(transactionIds);
    await pendingTransactionsArray.removeWhere((pt) => idsSet.has(pt.id));
  } catch (error) {
    console.error("Error removing pending transactions:", error);
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
    console.error("Error cleaning up old pending transactions:", error);
  }
}

/**
 * Create an Transaction from AR transaction data
 */
export async function createTransactionFromAR(
  txId: string,
  ownerAddress: string,
  recipient: string,
  amount: string,
  networkFee: string,
  dataSize: string,
  transactionType: "sent" | "received",
  tags: Array<{ name: string; value: string }> = [],
): Promise<void> {
  const now = new Date();
  const tx: ExtendedTransaction = {
    node: {
      id: txId,
      recipient,
      owner: { address: ownerAddress },
      quantity: { ar: amount },
      fee: { ar: networkFee },
      data: { size: dataSize },
      block: {
        timestamp: Math.floor(now.getTime() / 1000),
        height: 0,
      },
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
}

/**
 * Create an Transaction from AO transaction data
 */
export async function createTransactionFromAO(
  txId: string,
  ownerAddress: string,
  recipient: string,
  amount: string,
  tokenId: string,
  tokenInfo: TokenInfo,
  transactionType: "aoSent" | "aoReceived",
  networkFee: string,
  message?: string,
  tags: Array<{ name: string; value: string }> = [],
): Promise<void> {
  const now = new Date();
  const aoTags = [
    { name: "Data-Protocol", value: "ao" },
    { name: "Action", value: "Transfer" },
    { name: "Token", value: tokenId },
    { name: "Token-Address", value: tokenId },
    { name: "Recipient", value: recipient },
    { name: "Quantity", value: amount },
    { name: "Ticker", value: tokenInfo.Ticker },
    ...tags,
  ];

  const tx: ExtendedTransaction = {
    node: {
      id: txId,
      recipient: tokenId, // For AO, recipient is the process ID
      owner: { address: ownerAddress },
      quantity: { ar: "0" }, // AO transactions don't have AR quantity
      fee: { ar: networkFee },
      block: {
        timestamp: Math.floor(now.getTime() / 1000),
        height: 0,
      },
      data: {
        size: message ? new TextEncoder().encode(message).length.toString() : "0",
      },
      tags: aoTags,
    },
    cursor: "",
    transactionType,
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    date: null, // Will be set when fetched from GraphQL
    aoInfo: {
      tickerName: tokenInfo.Ticker,
      quantity: amount,
      denomination: tokenInfo.Denomination,
      logo: tokenInfo.Logo,
    },
  };

  await savePendingTransaction(ownerAddress, tx);
}
