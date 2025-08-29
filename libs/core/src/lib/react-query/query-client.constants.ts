import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000,
      refetchInterval: 300_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
