import { QueryClient, useQuery } from "@tanstack/react-query";
import { getArNSProfile } from "./arns";
import type { NameServiceProfile } from "./types";

export const NAME_SERVICE_QUERY_CLIENT = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Return a NameServiceProfile for a query
 *
 * @param walletAddress Address
 *
 * @returns NameServiceProfile | undefined
 */
async function getNameServiceProfile(walletAddress: string): Promise<NameServiceProfile | undefined> {
  const profile = NAME_SERVICE_QUERY_CLIENT.fetchQuery({
    queryKey: ["name-service-profile", walletAddress],
    queryFn: async () =>
      (await getArNSProfile(walletAddress)) || null,
    staleTime: 5 * 60 * 1000,
  });

  return profile;
}

/**
 * Return NameServiceProfile[] for a wallet addresses
 *
 * @param walletAddresses Address[]
 * @param refreshCache If true, refresh the profiles from the network
 *
 * @returns NameServiceProfile[] | undefined
 */
export async function getNameServiceProfiles(
  walletAddresses: string[],
): Promise<Array<NameServiceProfile>> {
  if (!walletAddresses || walletAddresses.length === 0) return [];

  const profiles = [];
  for (let wallet of walletAddresses) {
    const profile = await getNameServiceProfile(wallet);
    if (profile) {
      profiles.push(profile);
    }
  }
  return profiles;
}

export function useNameServiceProfiles(walletAddress: string[]) {
  return useQuery(
    {
      queryKey: ["name-service-profiles"],
      queryFn: async () => getNameServiceProfiles(walletAddress),
      staleTime: 5 * 60 * 1000,
    },
    NAME_SERVICE_QUERY_CLIENT,
  );
}

/**
 * React hook for Nameservice (ArNS, ANS) profile
 *
 * @param walletAddress Address
 *
 * @returns NameServiceProfile | undefined
 */
export function useNameServiceProfile(walletAddress: string) {
  return useQuery(
    {
      queryKey: ["name-service-profile-hook", walletAddress],
      queryFn: async () => getNameServiceProfile(walletAddress),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !!walletAddress,
    },
    NAME_SERVICE_QUERY_CLIENT,
  );
}
