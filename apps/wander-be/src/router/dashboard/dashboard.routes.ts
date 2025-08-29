import { AddContactDashboardView } from "~components/dashboard/subsettings/AddContact";
import { AddTokenDashboardView } from "~components/dashboard/subsettings/AddToken";
import { AddWalletDashboardView } from "~components/dashboard/subsettings/AddWallet";
import { AppSettingsDashboardView } from "~components/dashboard/subsettings/AppSettings";
import { ContactSettingsDashboardView } from "~components/dashboard/subsettings/ContactSettings";
import { TokenSettingsDashboardView } from "~components/dashboard/subsettings/TokenSettings";
import { WalletSettingsDashboardView } from "~components/dashboard/subsettings/WalletSettings";
import type { RouteConfig } from "~wallets/router/router.types";

export type DashboardRoutePath =
  | "/"
  // | `/notifications`
  | `/wallets`
  | `/wallets/${string}`
  // | `/wallets/${string}/export`
  // | `/wallets/${string}/qr`
  | `/apps`
  | `/apps/${string}`
  // | `/apps/${string}/permissions`
  | `/tokens`
  | `/tokens/new`
  | `/tokens/${string}`
  | `/contacts`
  | `/contacts/new`
  | `/contacts/${string}`;

export const DashboardSubSettingPaths = {
  AppSettings: "/apps/:url",
  AddWallet: "/wallets/new",
  WalletSettings: "/wallets/:address",
  AddToken: "/tokens/new",
  TokenSettings: "/tokens/:id",
  AddContact: "/contacts/new",
  ContactSettings: "/contacts/:address",
} as const satisfies Record<string, DashboardRoutePath>;

export const DASHBOARD_SUB_SETTING_ROUTES = [
  {
    path: DashboardSubSettingPaths.AppSettings,
    component: AppSettingsDashboardView,
  },
  {
    path: DashboardSubSettingPaths.AddWallet,
    component: AddWalletDashboardView,
  },
  {
    path: DashboardSubSettingPaths.WalletSettings,
    component: WalletSettingsDashboardView,
  },
  {
    path: DashboardSubSettingPaths.AddToken,
    component: AddTokenDashboardView,
  },
  {
    path: DashboardSubSettingPaths.TokenSettings,
    component: TokenSettingsDashboardView,
  },
  {
    path: DashboardSubSettingPaths.AddContact,
    component: AddContactDashboardView,
  },
  {
    path: DashboardSubSettingPaths.ContactSettings,
    component: ContactSettingsDashboardView,
  },
] as const satisfies RouteConfig[];
