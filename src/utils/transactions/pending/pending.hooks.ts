import { useEffect, useMemo, useState } from "react";
import { pendingTransactionsStats, setPendingTransactionsStats } from "./pending.utils";
import { useActiveAddress } from "~wallets/hooks";
import { TempTransactionStorage, useStorage } from "~utils/storage";
import { PENDING_TRANSACTIONS_STATS_TICK_KEY } from "./pending.constants";

export function useTokenPendingTransactionsStats(tokenId: string) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = pendingTransactionsStats.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, [pendingTransactionsStats]);

  return useMemo(() => pendingTransactionsStats.get(tokenId) || { count: 0, balance: "0" }, [tokenId, tick]);
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
