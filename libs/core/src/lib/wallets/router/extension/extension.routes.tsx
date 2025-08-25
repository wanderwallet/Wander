import type React from "react";
import type { CommonRouteProps, RouteConfig, RouteOverride } from "~wallets/router/router.types";

export type ExtensionRouteOverride = `/__OVERRIDES/cover` | `/__OVERRIDES/unlock` | `/__OVERRIDES/loading`;

export const ExtensionOverrides = {
  Cover: "/__OVERRIDES/cover",
  Unlock: "/__OVERRIDES/unlock",
  Loading: "/__OVERRIDES/loading",
} as const satisfies Record<string, ExtensionRouteOverride>;

export interface GetExtensionOverrideOptions {
  unlockView: React.ComponentType<CommonRouteProps>;
  loadingView: React.ComponentType<CommonRouteProps>;
}

export function getExtensionOverrides({ unlockView, loadingView }: GetExtensionOverrideOptions) {
  return [
    {
      path: ExtensionOverrides.Cover,
      component: () => <></>,
    },
    {
      path: ExtensionOverrides.Unlock,
      component: unlockView,
    },
    {
      path: ExtensionOverrides.Loading,
      component: loadingView,
    },
  ] satisfies RouteConfig<RouteOverride>[];
}
