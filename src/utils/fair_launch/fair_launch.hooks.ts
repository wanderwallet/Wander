import { useQuery } from "@tanstack/react-query";
import { getFairLaunchTokens } from "./fair_launch.utils";
import { defaultOptions } from "~tokens/hooks";

export const useFairLaunchTokens = () => {
  return useQuery({
    queryKey: ["fair-launch-tokens"],
    queryFn: () => getFairLaunchTokens(),
    select: (data) => data || [],
    ...defaultOptions,
  });
};
