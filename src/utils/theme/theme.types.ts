import type { DisplayTheme } from "@arconnect/components-rebrand";
import type { commonTokens, themeTokens } from "~components/embed/themes/theme-config";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextState {
  themeMode: ThemeMode;
  displayTheme: DisplayTheme;
}

export interface ThemeContextValue extends ThemeContextState {
  isDarkMode: boolean;
  tokens: typeof themeTokens;
  common: typeof commonTokens;
  setTheme: (themeMode: ThemeMode) => Promise<ThemeContextState>;
}
