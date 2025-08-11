import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useRef, useMemo } from "react";
import { themeTokens, commonTokens } from "../themes/theme-config";
import type { DisplayTheme } from "@arconnect/components-rebrand";
import useSetting from "~settings/hook";
import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";

export type ThemeMode = "light" | "dark" | "system";

const THEME_MODES = ["light", "dark", "system"] as const satisfies ThemeMode[];

const darkModePreference = typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

function resolveThemeMode(themeMode: ThemeMode) {
  return themeMode === "system" ? (darkModePreference.matches ? "dark" : "light") : themeMode;
}

interface ThemeContextState {
  themeMode: ThemeMode;
  displayTheme: DisplayTheme;
}

interface ThemeContextValue extends ThemeContextState {
  isDarkMode: boolean;
  tokens: typeof themeTokens;
  common: typeof commonTokens;
  setTheme: (themeMode: ThemeMode) => Promise<ThemeContextState>;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // User-defined setting, if any:

  const [themeSetting, setThemeSetting] = useSetting<ThemeMode>("display_theme");

  useAsyncEffect(async () => {
    const localStorage =
      import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? await LocalStorage.getInstance() : window.localStorage;

    // Delete old/duplicate theme localStorage value:
    localStorage.removeItem("theme");
  }, []);

  // Logic to prioritize which theme value to use, and to resolve it (system => light / dark):

  const getThemeState = useCallback(() => {
    // As defined in `wander-connect-sdk/src/utils/url/url.utils.ts` and `src/utils/embedded/embedded.utils.ts`
    const themeParam = new URLSearchParams(window.location.search).get("theme") as ThemeMode | null;

    // Default value:
    let themeMode: ThemeMode = "system";

    if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1" && themeSetting && THEME_MODES.includes(themeSetting)) {
      // User-defined setting has preference:
      themeMode = themeSetting;
    } else if (themeParam && THEME_MODES.includes(themeParam)) {
      // Otherwise, we check if the URL includes a theme param:
      themeMode = themeParam;
    }

    return {
      themeMode,
      displayTheme: resolveThemeMode(themeMode),
    } satisfies ThemeContextState;
  }, [themeSetting]);

  // Current theme mode:

  const [themeState, setThemeState] = useState<ThemeContextState>(getThemeState);

  const { themeMode, displayTheme } = themeState;

  console.log({ themeSetting, themeMode });

  useEffect(() => {
    setThemeState(getThemeState());
  }, [setThemeState, getThemeState]);

  // Manually change the theme (and persist the preference):

  const setThemeSettingAndStateTimeoutId = useRef(0);
  const lastThemeStateRef = useRef(themeState);
  lastThemeStateRef.current = themeState;

  const setTheme = useCallback(async (themeMode: ThemeMode) => {
    // TODO: We might want to add a value "use dApp preference" to clear the setting.

    if (!themeMode && !THEME_MODES.includes(themeMode)) throw new Error(`Invalid theme "${themeMode}"`);

    if (themeMode === lastThemeStateRef.current.themeMode) return;

    window.clearTimeout(setThemeSettingAndStateTimeoutId.current);

    async function setThemeSettingAndState() {
      try {
        const nextThemeState = {
          themeMode,
          displayTheme: resolveThemeMode(themeMode),
        };

        // Update state immediately to avoid waiting for the useEffect above to run:
        setThemeState(nextThemeState);

        // Persist preference:
        await setThemeSetting(themeMode);

        return nextThemeState;
      } catch (err) {
        console.error(`Error changing theme to "${themeMode}":`, err);

        // Revert change:
        setThemeState(lastThemeStateRef.current);
      }

      return null;
    }

    const cover = document.getElementById("cover");
    const displayTheme = resolveThemeMode(themeMode);

    if (cover && displayTheme !== lastThemeStateRef.current.displayTheme) {
      // If the resolved theme changes and we have a cover element, we want to prevent users from seeing a mix of
      // properties transitioning to their new value and some other ones abruptly changing, so:

      return new Promise<ThemeContextState>((resolve) => {
        // 1. We show the cover:
        cover.removeAttribute("aria-hidden");

        // 2. Wait for its fade-in transition to finish:
        setThemeSettingAndStateTimeoutId.current = window.setTimeout(() => {
          // 3. Change the theme:
          const updatedThemeState = setThemeSettingAndState();

          // 4. Wait for potential transition on properties affected by the theme change to finish:
          setThemeSettingAndStateTimeoutId.current = window.setTimeout(() => {
            // Hide it again:
            cover.setAttribute("aria-hidden", "true");

            resolve(updatedThemeState);
          }, 230);
        }, 230);
      });
    }

    // Otherwise, we update the preference and state straight away:
    return setThemeSettingAndState();
  }, []);

  // Listen for dark mode browser preference changes if the current themeMode is "system":

  useEffect(() => {
    if (themeMode !== "system") return;

    function handleDarkModePreferenceChange(e: MediaQueryListEvent) {
      setThemeState(getThemeState());
    }

    darkModePreference.addEventListener("change", handleDarkModePreferenceChange);

    return () => darkModePreference.removeEventListener("change", handleDarkModePreferenceChange);
  }, [themeMode, getThemeState]);

  // (ONLY CONNECT, NOT BE) Add `data-theme` attribute based on resolved theme (light or dark, not system):

  useEffect(() => {
    if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") return;

    document.documentElement.setAttribute("data-theme", displayTheme);
  }, [displayTheme]);

  // (ONLY CONNECT, NOT BE) Emit "THEME_CHANGE" event:

  useEffect(() => {
    if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1" || !isInsideIframe()) return;

    if (window.parent !== window) {
      // TODO: Update to use postEmbeddedMessage:
      window.parent.postMessage({ type: "THEME_CHANGE", data: themeState }, "*");
    }
  }, [themeState]);

  const themeContextValue: ThemeContextValue = useMemo(
    () => ({
      ...themeState,
      isDarkMode: themeState.displayTheme === "dark",
      tokens: themeTokens,
      common: commonTokens,
      setTheme,
    }),
    [themeState, setTheme],
  );

  return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
