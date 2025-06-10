import { useMutation } from "@tanstack/react-query";
import { LiquidOpsClient } from "../../LiquidOps";
import { tokenInput } from "liquidops";
import { getActiveAddress } from "~wallets";

interface LendParams {
  token: string;
  quantity: bigint;
}

type UnlendParams = LendParams;

interface Params {
  onSettled?: (
    data: string,
    error: Error,
    variables: LendParams | UnlendParams,
    context: unknown,
  ) => Promise<unknown> | unknown;
}

export function useLend({ onSettled }: Params) {
  const lendMutation = useMutation({
    mutationFn: async ({ token, quantity }: LendParams) => {
      const { client, free } = await LiquidOpsClient(true);

      try {
        const walletAddress = await getActiveAddress();
        const transferId = await client.lend({
          token,
          quantity,
          noResult: true,
        });

        const { tokenAddress, oTokenAddress } = tokenInput(token);
        const res = await client.trackResult({
          process: tokenAddress,
          message: transferId,
          targetProcess: oTokenAddress,
          match: {
            success: {
              Target: walletAddress,
              Tags: [{ name: "Action", values: "Mint-Confirmation" }],
            },
            fail: {
              Target: walletAddress,
              Tags: [{ name: "Action", values: ["Mint-Error", "Transfer-Error"] }],
            },
          },
        });

        if (res && res.match === "fail") {
          const errorMessage = res.message.Tags.find((tag) => tag.name === "Error")?.value || "Unknown error";

          throw new Error(errorMessage);
        }

        return "Lent assets";
      } finally {
        free();
      }
    },
    onSettled,
  });

  const unlendMutation = useMutation({
    mutationFn: async ({ token, quantity }: UnlendParams) => {
      const { client, free } = await LiquidOpsClient(true);

      try {
        const walletAddress = await getActiveAddress();
        const messageId = await client.unLend({
          token,
          quantity,
          noResult: true,
        });

        const { oTokenAddress } = tokenInput(token);
        const res = await client.trackResult({
          process: oTokenAddress,
          message: messageId,
          match: {
            success: {
              Target: walletAddress,
              Tags: [{ name: "Action", values: "Redeem-Confirmation" }],
            },
            fail: {
              Target: walletAddress,
              Tags: [{ name: "Action", values: "Redeem-Error" }],
            },
          },
        });

        if (res && res.match === "fail") {
          const errorMessage = res.message.Tags.find((tag) => tag.name === "Error")?.value || "Unknown error";

          throw new Error(errorMessage);
        }

        return "Unlent assets";
      } finally {
        free();
      }
    },
    onSettled,
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
