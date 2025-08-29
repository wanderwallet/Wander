import { defaultOptions } from "~tokens/hooks";
import { getAoxBridgeInfo, getVentoBridgeInfo } from "./bridge.utils";
import { useQuery } from "@tanstack/react-query";

export function useAoxBridgeInfo({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["aox-bridge-info"],
    queryFn: getAoxBridgeInfo,
    ...defaultOptions,
    enabled,
  });
}

export function useVentoBridgeInfo({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["vento-bridge-info"],
    queryFn: getVentoBridgeInfo,
    ...defaultOptions,
    enabled,
  });
}
