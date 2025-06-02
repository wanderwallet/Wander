import { useQuery } from "@tanstack/react-query";
import { getArweaveLink } from "~gateways/utils";

const defaultOptions = {
  refetchInterval: 300_000,
  staleTime: 300_000,
  gcTime: 300_000,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
};

export function useGateway(txId: string) {
  return useQuery({
    queryKey: ["gateway", txId],
    queryFn: async () => {
      try {
        return (await getArweaveLink(txId)) || `https://arweave.net/${txId}`;
      } catch (error) {
        throw error;
      }
    },
    ...defaultOptions,
    select: (data) => data || `https://arweave.net/${txId}`,
    enabled: !!txId,
  });
}
