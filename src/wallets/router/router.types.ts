import type React from "react";
import type { RouteComponentProps as WouteComponentProps } from "wouter";
import type { AuthRoutePath } from "~wallets/router/auth/auth.routes";
import type { DashboardRoutePath } from "~wallets/router/dashboard/dashboard.routes";
import type { EmbeddedRoutePath } from "~wallets/router/iframe/iframe.routes";
import type { PopupRoutePath } from "~wallets/router/popup/popup.routes";
import type { WelcomeRoutePath } from "~wallets/router/welcome/welcome.routes";

// Routes:

export interface CommonRouteProps<T = any>
  extends Omit<WouteComponentProps, "params"> {
  params: T;
}

export type RoutePath = `/${string}`;

export type RouteOverride = `/__OVERRIDES/${string}`;

export type RouteRedirect<T extends RoutePath = RoutePath> = `/__REDIRECT${T}`;

export type RouteAuthType = "auth" | "anon";

export interface RouteConfig<
  P extends RoutePath | RouteOverride = RoutePath | RouteOverride
> {
  key?: string;
  path: P;
  component: React.ComponentType<CommonRouteProps>;
  authType?: RouteAuthType;
}

export type WanderRoutePath =
  | WelcomeRoutePath
  | AuthRoutePath
  | PopupRoutePath
  | DashboardRoutePath
  | EmbeddedRoutePath;

// navigate():

export type NavigateAction = "prev" | "next" | "up" | number;

export interface NavigateOptions<S = any> {
  replace?: boolean;
  state?: S;
  search?: Record<string, string | number>;
}

export type NavigateFn<S = any> = (
  to: WanderRoutePath | NavigateAction,
  options?: NavigateOptions<S>
) => void;

// Location hooks:

export type BaseLocationHook = () => [
  RoutePath,
  (to: RoutePath, options?: any) => void
];
