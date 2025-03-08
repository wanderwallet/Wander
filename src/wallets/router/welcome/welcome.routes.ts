import { HomeWelcomeView } from "~routes/welcome";
import { GettingStartedSetupWelcomeView } from "~routes/welcome/gettingStarted";
import { SetupWelcomeView, type WelcomeSetupMode } from "~routes/welcome/setup";
import type { RouteConfig } from "~wallets/router/router.types";

export type WelcomeRoutePath =
  | "/"
  | `/start/${string}`
  | `/getting-started/${string}`
  | `/${WelcomeSetupMode}/${string}`;

export const WelcomePaths = {
  Home: "/",
  GettingStarted: "/getting-started/:page",
  Setup: "/:setupMode/:page"
} as const;

export const WELCOME_ROUTES = [
  {
    path: WelcomePaths.Home,
    component: HomeWelcomeView
  },
  {
    path: WelcomePaths.GettingStarted,
    component: GettingStartedSetupWelcomeView
  },
  {
    path: WelcomePaths.Setup,
    component: SetupWelcomeView
  }
] as const satisfies RouteConfig[];
