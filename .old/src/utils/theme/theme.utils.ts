import type { ThemeMode } from "~utils/theme/theme.types";

export const darkModePreference =
  typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

export function resolveThemeMode(themeMode: ThemeMode) {
  return themeMode === "system" ? (darkModePreference.matches ? "dark" : "light") : themeMode;
}

export function getFormattedColor(color: string) {
  let formattedColor = "";
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    formattedColor = color;
  } else if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    formattedColor = `#${color}`;
  } else if (/^\d{1,3}, ?\d{1,3}, ?\d{1,3}$/.test(color)) {
    formattedColor = `rgb(${color})`;
  } else if (/^\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?.+$/.test(color)) {
    formattedColor = `rgba(${color})`;
  }
  return formattedColor;
}
