import type { AuthStatus } from "~utils/embedded/embedded.types";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import type { WanderRoutePath } from "~wallets/router/router.types";

export type RouteType = "auth" | "account" | "settings" | "auth-request" | "default";

const routeTypeByLocationPrefix: Record<string, RouteType> = {
  auth: "auth",
  account: "account",
  "quick-settings": "settings",
  "auth-request": "auth-request",
};

export function locationToRouteType(path: WanderRoutePath, authStatus: AuthStatus): RouteType {
  if (path === EmbeddedPaths.SupportUnpartitionedStateMissing) {
    return authStatus === "unlocked" ? "default" : "auth";
  }

  const pathPrefix = path.split("/")[1] || "";

  return routeTypeByLocationPrefix[pathPrefix] || "default";
}

// TODO: This should match SDK's options:
export type EmbeddedLayout = "modal" | "popup" | "sidebar" | "half";

const preferredLayoutByRouteType: Record<RouteType, EmbeddedLayout> = {
  auth: "modal",
  account: "modal",
  settings: "popup",
  "auth-request": "popup",
  default: "popup",
};

export function routeTypeToPreferredLayout(routeType: RouteType): EmbeddedLayout {
  return preferredLayoutByRouteType[routeType] || "popup";
}
