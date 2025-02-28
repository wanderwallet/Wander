import { type SettingItemProps } from "~components/dashboard/list/SettingListItem";
import {
  AlertOctagon,
  BarChart07,
  Bell03,
  Coins04,
  CreditCard01,
  Grid01,
  InfoCircle,
  Maximize01,
  Pencil02,
  Settings01,
  Users01,
  UserSquare
} from "@untitled-ui/icons-react";
import settings, { getSetting } from "~settings";
import type Setting from "~settings/setting";

// Basic Settings:
import { WalletsDashboardView } from "~components/dashboard/Wallets";

import { ApplicationsDashboardView } from "~components/dashboard/Applications";
import { TokensDashboardView } from "~components/dashboard/Tokens";
import { ContactsDashboardView } from "~components/dashboard/Contacts";
import { NotificationSettingsDashboardView } from "~components/dashboard/NotificationSettings";
import { AboutDashboardView } from "~components/dashboard/About";

// Advance Settings:
import { SignSettingsDashboardView } from "~components/dashboard/SignSettings";
import { ResetDashboardView } from "~components/dashboard/Reset";
import { AnalyticsSettingsDashboardView } from "~components/dashboard/Analytics";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

export interface DashboardRouteConfig extends Omit<SettingItemProps, "active"> {
  name: string;
  externalLink?: string;
  component?: (...args: any[]) => JSX.Element;
}

export function isDashboardRouteConfig(
  data: DashboardRouteConfig | Setting
): data is DashboardRouteConfig {
  return data.hasOwnProperty("component");
}

export const basicSettings: (DashboardRouteConfig | Setting)[] = [
  {
    name: "wallets",
    displayName: "setting_accounts",
    description: "setting_accounts_description",
    icon: Users01,
    component: WalletsDashboardView
  },
  {
    name: "apps",
    displayName: "setting_apps",
    description: "setting_apps_description",
    icon: Grid01,
    component: ApplicationsDashboardView
  },
  {
    name: "tokens",
    displayName: "setting_tokens",
    description: "setting_tokens_description",
    icon: Coins04,
    component: TokensDashboardView
  },
  {
    name: "contacts",
    displayName: "setting_contacts",
    description: "setting_contacts_description",
    icon: UserSquare,
    component: ContactsDashboardView
  },
  getSetting("display_theme"),
  {
    name: "notifications",
    displayName: "setting_notifications",
    description: "setting_notifications_description",
    icon: Bell03,
    component: NotificationSettingsDashboardView
  },
  getSetting("gateways"),
  {
    name: "about",
    displayName: "setting_about",
    description: "setting_about_description",
    icon: InfoCircle,
    component: AboutDashboardView
  }
];

export const advancedSettings: (DashboardRouteConfig | Setting)[] = [
  {
    name: "password_settings",
    displayName: "setting_password_settings",
    description: "setting_password_settings_description",
    icon: Pencil02,
    component: SignSettingsDashboardView
  },
  ...settings.filter(
    (setting) =>
      setting.name !== "display_theme" &&
      setting.name !== "analytics" &&
      setting.name !== "gateways"
  ),
  // TODO
  /*{
    name: "config",
    displayName: "setting_config",
    description: "setting_config_description",
    icon: DownloadIcon
  },*/
  {
    name: "analytics",
    displayName: "setting_analytic",
    icon: BarChart07,
    description: "setting_analytics_description",
    component: AnalyticsSettingsDashboardView
  },
  {
    name: "reset",
    displayName: "setting_reset",
    description: "setting_reset_description",
    icon: AlertOctagon,
    component: ResetDashboardView
  }
];

export const allSettings: (DashboardRouteConfig | Setting)[] = [
  ...basicSettings,
  ...advancedSettings
];

// Menu items are: wallets, apps, tokens, contact, notifications and "All Settings":
export const quickSettingsMenuItems: Omit<
  DashboardRouteConfig,
  "description"
>[] = [
  {
    name: "apps",
    displayName: "connected_apps",
    icon: Grid01,
    component: ApplicationsDashboardView
  },
  {
    name: "tokens",
    displayName: "setting_tokens",
    icon: Coins04,
    component: TokensDashboardView
  },
  {
    name: "contacts",
    displayName: "setting_contacts",
    icon: UserSquare,
    component: ContactsDashboardView
  },
  {
    name: "subscriptions",
    displayName: "subscriptions",
    icon: CreditCard01,
    component: NotificationSettingsDashboardView
  },
  {
    name: "about",
    displayName: "setting_about",
    icon: InfoCircle,
    component: AboutDashboardView,
    externalLink: "tabs/dashboard.html#/about"
  },
  {
    name: "All Settings",
    displayName: "setting_all_settings",
    icon: Settings01,
    externalLink: "tabs/dashboard.html"
  }
];

if (process.env.NODE_ENV === "development" && !IS_EMBEDDED_APP) {
  quickSettingsMenuItems.splice(5, 0, {
    name: "fullscreen",
    displayName: "setting_fullscreen",
    icon: Maximize01,
    externalLink: "tabs/fullscreen.html"
  });
}
