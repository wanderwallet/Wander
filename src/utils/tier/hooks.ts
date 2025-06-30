import { useQuery } from "@tanstack/react-query";
import { useActiveAddress } from "~wallets/hooks";
import type { ActiveTier } from "./types";
import { getActiveTier } from "./utils";

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
