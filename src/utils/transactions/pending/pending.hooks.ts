import { useEffect, useState, useRef, useMemo } from "react";
import { pendingTransactionsStats, setPendingTransactionsStats } from "./pending.utils";
import { useActiveAddress } from "~wallets/hooks";
import { TempTransactionStorage, useStorage } from "~utils/storage";
import { PENDING_TRANSACTIONS_STATS_TICK_KEY } from "./pending.constants";
import browser from "webextension-polyfill";

const EMPTY = { count: 0, sentBalance: "0", receivedBalance: "0" };

export function useTokenPendingTransactionsStats(tokenId: string) {
  const tokenIdRef = useRef(tokenId);
  const [data, setData] = useState(() => pendingTransactionsStats.get(tokenId) ?? EMPTY);

  useEffect(() => {
    tokenIdRef.current = tokenId;
    setData(pendingTransactionsStats.get(tokenId) ?? EMPTY);

    const unsub = pendingTransactionsStats.subscribe(() => {
      const currentTokenId = tokenIdRef.current;
      const snapshot = pendingTransactionsStats.get(currentTokenId) ?? EMPTY;
      setData((prev) => {
        // Only update if data actually changed
        if (
          prev.count !== snapshot.count ||
          prev.sentBalance !== snapshot.sentBalance ||
          prev.receivedBalance !== snapshot.receivedBalance
        ) {
          return snapshot;
        }
        return prev;
      });
    });

    return unsub;
  }, [tokenId]);

  return data;
}

export function useUpdatePendingTransactionsStats() {
  const activeAddress = useActiveAddress();
  const [pendingTransactionsStatsTick] = useStorage<number>({
    key: PENDING_TRANSACTIONS_STATS_TICK_KEY,
    instance: TempTransactionStorage,
  });

  useEffect(() => {
    setPendingTransactionsStats();
  }, [activeAddress, pendingTransactionsStatsTick]);
}

/**
 * Hook to compute the pending transactions message based on stats
 */
export function usePendingTransactionsMessage(
  count: number,
  sentBalance: string,
  receivedBalance: string,
  ticker: string,
): string | null {
  return useMemo(() => {
    if (!count || !sentBalance || !receivedBalance || !ticker) return null;

    const txText = browser.i18n.getMessage(count > 1 ? "tx_plural" : "tx_singular");
    const hasSent = Number(sentBalance) > 0;
    const hasReceived = Number(receivedBalance) > 0;

    // both
    if (hasSent && hasReceived) {
      return browser.i18n.getMessage("pending_transactions_message", [
        String(count),
        txText,
        sentBalance,
        receivedBalance,
        ticker,
      ]);
    }

    // only sent
    if (hasSent) {
      return browser.i18n.getMessage("pending_transactions_message_sent", [String(count), txText, sentBalance, ticker]);
    }

    // only received
    if (hasReceived) {
      return browser.i18n.getMessage("pending_transactions_message_received", [
        String(count),
        txText,
        receivedBalance,
        ticker,
      ]);
    }

    return null;
  }, [count, sentBalance, receivedBalance, ticker]);
}
