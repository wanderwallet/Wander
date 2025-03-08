import { currencies } from "~utils/currency";
import Setting from "./setting";
import {
  BarChart07,
  Compass01,
  CurrencyDollarCircle,
  Percent02,
  Star01,
  Sun
} from "@untitled-ui/icons-react";
import { ExtensionStorage } from "~utils/storage";

export const PREFIX = "setting_";

/** All settings */
const settings: Setting[] = [
  // new Setting({
  //   name: "subscription_allowance",
  //   displayName: "subscription_allowance",
  //   icon: CreditCard02,
  //   description: "subscription_description",
  //   type: "number",
  //   defaultValue: 0
  // }),
  new Setting({
    name: "fee_multiplier",
    displayName: "setting_fee_multiplier",
    icon: Percent02,
    description: "setting_fee_multiplier_description",
    type: "number",
    defaultValue: 1
  }),
  new Setting({
    name: "currency",
    displayName: "setting_currency",
    icon: CurrencyDollarCircle,
    description: "setting_setting_currency_description",
    type: "pick",
    options: currencies,
    defaultValue: "USD",
    inputPlaceholder: "search_currency"
  }),
  /*new Setting({
    name: "arverify",
    displayName: "setting_arverify",
    icon: CheckIcon,
    description: "setting_setting_arverify_description",
    type: "number",
    defaultValue: 60
  }),*/
  new Setting({
    name: "display_theme",
    displayName: "setting_display_theme",
    icon: Sun,
    description: "setting_display_theme_description",
    type: "pick",
    options: ["system", "light", "dark"],
    defaultValue: "system"
  }),
  new Setting({
    name: "arconfetti",
    displayName: "setting_arconfetti",
    icon: Star01,
    description: "setting_setting_arconfetti_description",
    type: "pick",
    options: [false, "arweave", "hedgehog", "usd"],
    defaultValue: "arweave"
  }),
  new Setting({
    name: "gateways",
    displayName: "setting_gateways",
    icon: Compass01,
    description: "setting_gateways_description",
    type: "pick",
    options: [],
    defaultValue: { host: "arweave.net", port: 443, protocol: "https" }
  }),
  new Setting({
    name: "analytics",
    displayName: "setting_analytic",
    icon: BarChart07,
    description: "setting_analytics_description",
    type: "boolean",
    defaultValue: false
  })
];

/**
 * Get a setting instance
 */
export function getSetting(name: string) {
  return settings.find((setting) => setting.name === name);
}

export default settings;
