import { useQueries, useQuery } from "@tanstack/react-query";
import { getClaimableBalance, getDelegationInfo, getFairLaunchTokens } from "./fair_launch.utils";
import { defaultOptions } from "~tokens/hooks";
import { useActiveAddress } from "~wallets/hooks";
import { useMemo } from "react";
import { PI_FLP_ID } from "./fair_launch.constants";
import type { FlpTokenInfo } from "./fair_launch.types";

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
    enabled: !!activeAddress,
    ...defaultOptions,
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

export function useClaimableBalance(token: FlpTokenInfo) {
  const activeAddress = useActiveAddress();

  return useQuery<string>({
    queryKey: ["claimable-balance", token.flpId, activeAddress],
    queryFn: () => getClaimableBalance(token, activeAddress),
    enabled: !!activeAddress && !!token && !!token.flpId && !token.autoClaim,
    select: (data) => data || "0",
    ...defaultOptions,
  });
}

export function useHasClaimableBalance() {
  const { data: flpTokens = [] } = useFairLaunchTokens();
  const { data: delegationInfo = {} } = useDelegationInfo();
  const activeAddress = useActiveAddress();

  const claimableTokens = useMemo(
    () => flpTokens.filter((token) => !token.autoClaim && !!delegationInfo?.[token.flpId]),
    [flpTokens, delegationInfo],
  );

  const queries = useQueries({
    queries: claimableTokens.map((token) => ({
      queryKey: ["claimable-balance", token.flpId, activeAddress],
      queryFn: () => getClaimableBalance(token, activeAddress),
      enabled: !!activeAddress && !!token.flpId && !!delegationInfo?.[token.flpId],
      select: (data: string) => data || "0",
      ...defaultOptions,
    })),
  });

  return useMemo(() => queries.some((query) => !!query.data && query.data !== "0"), [queries]);
}
