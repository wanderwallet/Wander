import { useQuery } from "@tanstack/react-query";
import { getDelegationInfo, getFairLaunchTokens } from "./fair_launch.utils";
import { defaultOptions } from "~tokens/hooks";
import { useActiveAddress } from "~wallets/hooks";
import { useMemo } from "react";
import { PI_FLP_ID } from "./fair_launch.constants";

export const useFairLaunchTokens = () => {
  return useQuery({
    queryKey: ["fair-launch-tokens"],
    queryFn: () => getFairLaunchTokens(),
    select: (data) => data || [],
    ...defaultOptions,
  });
};

export function useDelegationInfo() {
  const activeAddress = useActiveAddress();

  return useQuery<Record<string, number>>({
    queryKey: ["ao-delegation-info", activeAddress],
    queryFn: () => getDelegationInfo(activeAddress),
    refetchInterval: 60_000,
    staleTime: 60_000,
    gcTime: 60_000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    enabled: !!activeAddress,
  });
}

export function useDelegationPercentByType() {
  const { data: delegationInfo = {} } = useDelegationInfo();
  const activeAddress = useActiveAddress();

  return useMemo(() => {
    let primary = 0;
    let projects = 0;

    for (const [key, value] of Object.entries(delegationInfo)) {
      if (key === activeAddress || key === PI_FLP_ID) {
        primary += value;
      } else {
        projects += value;
      }
    }

    return {
      primaryPercent: primary,
      projectsPercent: projects,
    };
  }, [delegationInfo, activeAddress]);
}
