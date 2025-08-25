import type { DisplayTheme } from "@arconnect/components-rebrand";
import { useEffect } from "react";
import { useTheme as useStyledComponentsTheme } from "styled-components";
import { ARCONNECT_THEME_BACKGROUND_COLOR, ARCONNECT_THEME_TEXT_COLOR } from "~utils/storage.utils";
import { getFormattedColor } from "~utils/theme/theme.utils";

export interface ThemeBackgroundObserverProps {
  displayTheme?: DisplayTheme;
}

export function ThemeBackgroundObserver({ displayTheme }: ThemeBackgroundObserverProps) {
  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") return null;

  const styledComponentsTheme = useStyledComponentsTheme();
  const backgroundColor = styledComponentsTheme.background;
  const textColor = styledComponentsTheme.primaryText;

  useEffect(() => {
    if (!displayTheme) return;

    const formattedBackgroundColor = getFormattedColor(backgroundColor);

    if (formattedBackgroundColor) {
      localStorage.setItem(ARCONNECT_THEME_BACKGROUND_COLOR, formattedBackgroundColor);

      document.documentElement.style.setProperty("--backgroundColor", formattedBackgroundColor);
    }
  }, [displayTheme, backgroundColor]);

  useEffect(() => {
    if (!displayTheme) return;

    const formattedTextColor = getFormattedColor(textColor);

    if (formattedTextColor) {
      localStorage.setItem(ARCONNECT_THEME_TEXT_COLOR, formattedTextColor);

      document.documentElement.style.setProperty("--textColor", formattedTextColor);
    }
  }, [displayTheme, textColor]);

  return null;
}
