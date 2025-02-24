import { useHashLocation } from "wouter/use-hash-location";
import { NOOP } from "~utils/misc";
import { useWallets } from "~utils/wallets/wallets.hooks";
import type { WalletStatus } from "~utils/wallets/wallets.provider";
import type { ExtensionRouteOverride } from "~wallets/router/extension/extension.routes";
import type {
  WanderRoutePath,
  BaseLocationHook
} from "~wallets/router/router.types";

const WALLET_STATUS_TO_OVERRIDE: Record<
  WalletStatus,
  ExtensionRouteOverride | null
> = {
  noWallets: "/__OVERRIDES/cover",
  loading: "/__OVERRIDES/loading",
  locked: "/__OVERRIDES/unlock",
  unlocked: null
};

export function useExtensionStatusOverride() {
  const { walletStatus } = useWallets();

  return WALLET_STATUS_TO_OVERRIDE[walletStatus];
}

export const useExtensionLocation: BaseLocationHook = () => {
  const [wocation, wavigate] = useHashLocation();
  const override = useExtensionStatusOverride();

  if (override) return [override, NOOP];

  return [wocation as WanderRoutePath, wavigate];
};
