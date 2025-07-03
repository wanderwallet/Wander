import { useQuery } from "@tanstack/react-query";
import { useActiveAddress } from "~wallets/hooks";
import type { ActiveTier } from "./types";
import { getActiveTier, getDefiFeeDetailsForTier, getWalletLifetimeSavings } from "./utils";
import { useMemo } from "react";
import { defaultOptions } from "~tokens/hooks";

export function useActiveTier() {
  const activeAddress = useActiveAddress();

  return useQuery<ActiveTier>({
    queryKey: ["active-tier", activeAddress],
    queryFn: async () => getActiveTier(activeAddress),
    enabled: !!activeAddress,
    ...defaultOptions,
  });
}

export function useWalletLifetimeSavings() {
  const activeAddress = useActiveAddress();

  return useQuery<string>({
    queryKey: ["wallet-savings", activeAddress],
    queryFn: async () => getWalletLifetimeSavings(activeAddress),
    enabled: !!activeAddress,
    select: (data) => data || "0",
    ...defaultOptions,
  });
}

export function useDefiFeeDetails() {
  const { data: activeTier } = useActiveTier();

  return useMemo(() => {
    if (!activeTier) return null;
    return getDefiFeeDetailsForTier(activeTier.tier);
  }, [activeTier]);
}
