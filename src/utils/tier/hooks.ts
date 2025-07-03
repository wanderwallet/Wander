import { useQuery } from "@tanstack/react-query";
import { useActiveAddress } from "~wallets/hooks";
import type { ActiveTier } from "./types";
import { getActiveTier, getDefiFeeDetailsForTier, getWalletSavings } from "./utils";
import { useMemo } from "react";

export function useActiveTier() {
  const activeAddress = useActiveAddress();

  return useQuery<ActiveTier>({
    queryKey: ["active-tier", activeAddress],
    queryFn: async () => getActiveTier(activeAddress),
    enabled: !!activeAddress,
    refetchInterval: 60_000,
    staleTime: 60_000,
    gcTime: 60_000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });
}

export function useWalletSavings() {
  const activeAddress = useActiveAddress();

  return useQuery<string>({
    queryKey: ["wallet-savings", activeAddress],
    queryFn: async () => getWalletSavings(activeAddress),
    enabled: !!activeAddress,
    refetchInterval: 60_000,
    staleTime: 60_000,
    gcTime: 60_000,
    retry: 3,
    select: (data) => data || "0",
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });
}

export function useDefiFeeDetails() {
  const { data: activeTier } = useActiveTier();

  return useMemo(() => {
    if (!activeTier) return null;
    return getDefiFeeDetailsForTier(activeTier.tier);
  }, [activeTier]);
}
