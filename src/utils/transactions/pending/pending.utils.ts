import { hasTransferError, sortFn, type ExtendedTransaction } from "~lib/transactions";
import { getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import type { GQLNodeInterface } from "ar-gql/dist/faces";
import { createStorageArray } from "~utils/storage/storage.array";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import type Transaction from "arweave/web/lib/transaction";
import type { Tag } from "arweave/web/lib/transaction";
import { balanceToFractioned } from "~tokens/currency";
import BigNumber from "bignumber.js";
import { gql } from "~gateways/api";
import { retryWithDelay } from "~utils/promises/retry";
import { txHistoryGateways } from "~gateways/gateway";
import { arweave } from "~utils/agents/utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { PendingTransaction } from "./pending.types";
import {
  PENDING_TRANSACTIONS_QUERY,
  PENDING_AO_TRANSACTIONS_QUERY,
  PENDING_TRANSACTIONS_STATS_TICK_KEY,
} from "./pending.constants";
import {
  clearPendingTransactionsAlarm,
  scheduleAoTransactionCleanupAlarms,
  schedulePendingTransactionsCleanupAlarm,
} from "./pending.alarms";
import { getActiveAddress } from "~wallets";
import { TempTransactionStorage } from "~utils/storage";

export class ObservableMap<K, V> {
  private map = new Map<K, V>();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {}
    }
  }

  set(key: K, value: V) {
    this.map.set(key, value);
    this.notify();
    return this;
  }

  setAll(entries: [K, V][]) {
    this.map.clear();
    for (const [key, value] of entries) {
      this.map.set(key, value);
    }
    this.notify();
    return this;
  }

  delete(key: K) {
    const result = this.map.delete(key);
    if (result) this.notify();
    return result;
  }

  clear() {
    if (this.map.size === 0) return;
    this.map.clear();
    this.notify();
  }

  // read methods
  get(key: K) {
    return this.map.get(key);
  }
  has(key: K) {
    return this.map.has(key);
  }
  entries() {
    return this.map.entries();
  }
  values() {
    return this.map.values();
  }
  keys() {
    return this.map.keys();
  }
  size() {
    return this.map.size;
  }
}

export const pendingTransactionsStats = new ObservableMap<string, { count: number; balance: string }>();

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
    await pendingTransactionsArray.updateWhere(
      (pt) => idsSet.has(pt.id) && !pt.foundInGraphQL,
      (pt) => ({ ...pt, foundInGraphQL: true }),
    );
    await pendingTransactionsArray.removeWhere((pt) => idsSet.has(pt.id) && pt.createdAt <= fiveMinutesAgo);
    await setPendingTransactionsStats();
    await TempTransactionStorage.set(PENDING_TRANSACTIONS_STATS_TICK_KEY, Date.now());
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error removing pending transactions:", error);
  }
}

/**
 * Clean up old pending transactions (older than 6 hours)
 */
export async function cleanupOldPendingTransactions(): Promise<void> {
  try {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const removed = await pendingTransactionsArray.removeWhere((pt) => pt.createdAt <= sixHoursAgo);
    if (removed > 0) await setPendingTransactionsStats();
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error cleaning up old pending transactions:", error);
  }
}

/**
 * Check and remove pending transactions that are now confirmed in GraphQL.
 */
export async function checkAndCleanPendingTransactions(): Promise<void> {
  try {
    // Filter out already found transactions
    const pending = await pendingTransactionsArray.filter((tx) => !tx.foundInGraphQL);
    if (!pending.length) {
      await clearPendingTransactionsAlarm();
      return;
    }

    const arTx = pending.filter((tx) => !tx.transaction.aoInfo);
    const aoTx = pending.filter((tx) => tx.transaction.aoInfo);

    const BATCH_SIZE = 100;
    const confirmed = new Set<string>();

    const checkBatches = async (ids: string[], query: string) => {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);

        try {
          const result = await retryWithDelay(async (attempt) => {
            const gateway = txHistoryGateways[attempt % txHistoryGateways.length];
            const res = await gql(query, { ids: batch }, gateway);

            if (res?.data === null && (res as any)?.errors?.length) {
              throw new Error((res as any).errors?.[0]?.message || "GraphQL Error");
            }
            return res;
          }, 2);

          const edges = result?.data?.transactions?.edges || [];
          for (const edge of edges) {
            const id = edge?.node?.id;
            if (id) {
              // Only confirm AR transactions that have a timestamp
              if (+edge?.node?.quantity?.ar > 0) {
                if (edge?.node?.block?.timestamp) confirmed.add(id);
              } else {
                confirmed.add(id);
              }
            }
          }
        } catch (err) {
          log(LOG_GROUP.TRANSACTIONS, "Error checking pending batch:", err);
          // Continue to next batch even on failure
        }
      }
    };

    // Check AR + AO in parallel
    await Promise.allSettled([
      arTx.length
        ? checkBatches(
            arTx.map((t) => t.id),
            PENDING_TRANSACTIONS_QUERY,
          )
        : null,
      aoTx.length
        ? checkBatches(
            aoTx.map((t) => t.id),
            PENDING_AO_TRANSACTIONS_QUERY,
          )
        : null,
    ]);

    // Remove confirmed
    if (confirmed.size) {
      await removePendingTransactions([...confirmed]);
      log(LOG_GROUP.TRANSACTIONS, `Removed ${confirmed.size} confirmed pending transactions`);
    }

    // If no pending remain, clear cleanup alarms
    const left = await pendingTransactionsArray.filter((pt) => !pt.foundInGraphQL);
    if (left.length === 0) {
      await clearPendingTransactionsAlarm();
    }
  } catch (err) {
    log(LOG_GROUP.TRANSACTIONS, "Error checking and cleaning pending transactions:", err);
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
    await schedulePendingTransactionsCleanupAlarm();
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
    await scheduleAoTransactionCleanupAlarms();
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error creating AO pending transaction:", error);
  }
}

export async function mergeWithPending(
  baseTransactions: ExtendedTransaction[],
  pendingTransactions: ExtendedTransaction[],
): Promise<ExtendedTransaction[]> {
  const graphqlTxIds = new Set(baseTransactions.map((tx) => tx.node.id));
  const newPendingTxs = pendingTransactions.filter((tx) => !graphqlTxIds.has(tx.node.id));

  // Remove pending transactions that are now available in GraphQL
  if (graphqlTxIds.size > 0) {
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

// Calculate and store pending transaction stats
export async function setPendingTransactionsStats(): Promise<void> {
  const address = await getActiveAddress();
  const transactions = await pendingTransactionsArray.filter((tx) => tx.address === address && !tx.foundInGraphQL);

  // Group by token and calculate stats with balance
  const tokenStats = new Map<string, { count: number; quantity: BigNumber; denomination: number }>();

  for (const tx of transactions) {
    let tokenId: string;
    let quantity: string;
    let denomination: number;

    if (tx.transaction.aoInfo) {
      tokenId = tx.transaction.node.recipient;
      quantity = tx.transaction.aoInfo?.quantity || "0";
      denomination = tx.transaction.aoInfo?.denomination || 0;
    } else {
      tokenId = AR_PROCESS_ID;
      quantity = tx.transaction.node.quantity.ar;
      denomination = 12;
    }

    // Initialize if needed
    if (!tokenStats.has(tokenId)) {
      tokenStats.set(tokenId, { count: 0, quantity: new BigNumber(0), denomination });
    }

    const stats = tokenStats.get(tokenId);
    stats.count++;
    stats.quantity = stats.quantity.plus(quantity);
    stats.denomination = denomination;
  }

  const entries: [string, { count: number; balance: string }][] = [];
  for (const [tokenId, stats] of tokenStats.entries()) {
    const isAr = tokenId === AR_PROCESS_ID;
    const balance = isAr
      ? stats.quantity.toFixed()
      : balanceToFractioned(stats.quantity.toFixed(), stats.denomination).toFixed();

    entries.push([
      tokenId,
      {
        count: stats.count,
        balance,
      },
    ]);
  }

  pendingTransactionsStats.setAll(entries);

  log(LOG_GROUP.TRANSACTIONS, "Pending transactions stats updated:", Array.from(pendingTransactionsStats.entries()));
}
