import { type PropsWithChildren } from "react";
import { useHardwareApi } from "~wallets/hooks";
import {
  ARCONNECT_DARK_THEME,
  ARCONNECT_LIGHT_THEME,
  Provider as ThemeProvider,
  type ArconnectTheme,
} from "@arconnect/components-rebrand";
import { useTheme } from "~utils/theme/theme.hook";
import { ThemeBackgroundObserver } from "~utils/theme/observer/theme-observer.component";

/**
 * Modify the theme if the active wallet is a hardware wallet. We transform the
 * default accent color to match the hardware wallet's accent.
 */
function hardwareThemeModifier(theme: ArconnectTheme): ArconnectTheme {
  return {
    ...theme,
    theme: "#9AB8FF",
    primary: "#9AB8FF",
    primaryBtnHover: "#6F93E1",
  };
}

function noThemeModifier(theme: ArconnectTheme): ArconnectTheme {
  return theme;
}

export function StyledComponentsThemeProvider({ children }: PropsWithChildren<{}>) {
  const { displayTheme } = useTheme();
  const hardwareApi = useHardwareApi();
  const themeModifier = hardwareApi ? hardwareThemeModifier : noThemeModifier;

  return (
    <ThemeProvider theme={themeModifier(displayTheme === "dark" ? ARCONNECT_DARK_THEME : ARCONNECT_LIGHT_THEME)}>
      <ThemeBackgroundObserver displayTheme={displayTheme} />

      {children}
    </ThemeProvider>
  );
}
