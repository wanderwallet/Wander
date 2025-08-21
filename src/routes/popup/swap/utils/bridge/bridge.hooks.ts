import { defaultOptions } from "~tokens/hooks";
import { getBridgeInfo } from "./bridge.utils";
import { useQuery } from "@tanstack/react-query";

export function useBridgeInfo({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["bridge-info"],
    queryFn: getBridgeInfo,
    ...defaultOptions,
    enabled,
  });
}
