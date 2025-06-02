import { useMutation } from "@tanstack/react-query";
import { LiquidOpsClient } from "../../LiquidOps";

interface LendParams {
  token: string;
  quantity: bigint;
}

type UnlendParams = LendParams;

export function useLend() {
  const lendMutation = useMutation({
    mutationFn: async ({ token, quantity }: LendParams) => {
      try {
        const client = await LiquidOpsClient();
        return client.lend({
          token,
          quantity,
        });
      } catch (error) {
        throw error;
      }
    },
  });

  const unlendMutation = useMutation({
    mutationFn: async ({ token, quantity }: UnlendParams) => {
      try {
        const client = await LiquidOpsClient();
        return await client.unLend({
          token,
          quantity,
        });
      } catch (error) {
        throw error;
      }
    },
  });

  return {
    lend: lendMutation.mutate,
    isLending: lendMutation.isPending,
    lendError: lendMutation.error,

    unlend: unlendMutation.mutate,
    isUnlending: unlendMutation.isPending,
    unlendError: unlendMutation.error,

    reset: () => {
      lendMutation.reset();
      unlendMutation.reset();
    },
  };
}
