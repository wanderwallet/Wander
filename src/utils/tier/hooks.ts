import { useQuery } from "@tanstack/react-query";
import { useActiveAddress } from "~wallets/hooks";
import type { Tier } from "./types";

const tiers = [
  {
    name: "Gold",
    iconColor: "#D5AA0F",
  },
  {
    name: "Silver",
    iconColor: "#90A1A5",
  },
  {
    name: "Bronze",
    iconColor: "#EDA355",
  },
];

export function useActiveTier() {
  const activeAddress = useActiveAddress();

  return useQuery<Tier>({
    queryKey: ["active-tier", activeAddress],
    queryFn: () => tiers[0],
    enabled: !!activeAddress,
    refetchInterval: 60_000,
    staleTime: 60_000,
    gcTime: 60_000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });
}
