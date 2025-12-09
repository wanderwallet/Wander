import { useMemo, useEffect, useState } from "react";
import {
  getTokenPendingTransactionsStats,
  setPendingTransactionsMap,
  onPendingTransactionsMapChange,
} from "./pending.utils";

let globalMapVersion = 0;
const listeners = new Set<() => void>();

const emit = () => {
  globalMapVersion++;
  for (const cb of listeners) cb();
};

let watcherInitialized = false;

function ensureWatcher() {
  if (watcherInitialized) return;
  watcherInitialized = true;

  // Initialize map once
  setPendingTransactionsMap().then(() => emit());

  // Subscribe to map changes directly
  onPendingTransactionsMapChange(() => emit());
}

ensureWatcher();

function useGlobalMapVersion(): number {
  const [version, setVersion] = useState(globalMapVersion);

  useEffect(() => {
    const cb = () => setVersion(globalMapVersion);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return version;
}

export function useTokenPendingTransactionsStats(tokenId: string, denomination: number) {
  const version = useGlobalMapVersion();

  return useMemo(() => getTokenPendingTransactionsStats(tokenId, denomination), [tokenId, denomination, version]);
}
