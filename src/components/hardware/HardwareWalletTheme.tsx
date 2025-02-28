import { useEffect, type PropsWithChildren } from "react";
import { useHardwareApi } from "~wallets/hooks";
import { getFormattedColor, useTheme } from "~utils/theme";
import { useTheme as useStyledComponentsTheme } from "styled-components";
import { MotionGlobalConfig } from "framer-motion";
import {
  ARCONNECT_DARK_THEME,
  ARCONNECT_LIGHT_THEME,
  Provider as ThemeProvider,
  type ArconnectTheme,
  type DisplayTheme
} from "@arconnect/components-rebrand";
import {
  ARCONNECT_THEME_BACKGROUND_COLOR,
  ARCONNECT_THEME_TEXT_COLOR
} from "~utils/storage.utils";

/**
 * Modify the theme if the active wallet is a hardware wallet. We transform the
 * default accent color to match the hardware wallet's accent.
 */
function hardwareThemeModifier(theme: ArconnectTheme): ArconnectTheme {
  return {
    ...theme,
    theme: "#9AB8FF",
    primary: "#9AB8FF",
    primaryBtnHover: "#6F93E1"
  };
}

function noThemeModifier(theme: ArconnectTheme): ArconnectTheme {
  return theme;
}

export function WanderThemeProvider({ children }: PropsWithChildren<{}>) {
  const hardwareApi = useHardwareApi();
  const theme = useTheme();
  const themeModifier = hardwareApi ? hardwareThemeModifier : noThemeModifier;

  useEffect(() => {
    const reducedMotionPreference = window.matchMedia(
      "(prefers-reduced-motion)"
    );

    if (reducedMotionPreference.matches) {
      // This could also be always set to `true` at the top of the file and then set to `false` after the application
      // loads if we still notice some flicker due to any animation/transition playing when the view first loads.

      MotionGlobalConfig.skipAnimations = true;
    }
  }, []);

  return (
    <ThemeProvider
      theme={themeModifier(
        theme === "dark" ? ARCONNECT_DARK_THEME : ARCONNECT_LIGHT_THEME
      )}
    >
      <ThemeBackgroundObserver theme={theme} />

      {children}
    </ThemeProvider>
  );
}

interface ThemeBackgroundObserverProps {
  theme?: DisplayTheme;
}

export function ThemeBackgroundObserver({
  theme
}: ThemeBackgroundObserverProps) {
  const styledComponentsTheme = useStyledComponentsTheme();
  const backgroundColor = styledComponentsTheme.background;
  const textColor = styledComponentsTheme.primaryText;

  useEffect(() => {
    if (!theme) return;

    let formattedBackgroundColor = getFormattedColor(backgroundColor);

    if (formattedBackgroundColor) {
      localStorage.setItem(
        ARCONNECT_THEME_BACKGROUND_COLOR,
        formattedBackgroundColor
      );

      document.documentElement.style.setProperty(
        "--backgroundColor",
        formattedBackgroundColor
      );
    }
  }, [theme, backgroundColor]);

  useEffect(() => {
    if (!theme) return;

    let formattedTextColor = getFormattedColor(textColor);

    if (formattedTextColor) {
      localStorage.setItem(ARCONNECT_THEME_TEXT_COLOR, formattedTextColor);

      document.documentElement.style.setProperty(
        "--textColor",
        formattedTextColor
      );
    }
  }, [theme, textColor]);

  return null;
}
