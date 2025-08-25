import { useState, useEffect, useCallback, useRef, useMemo, type PropsWithChildren } from "react";
import { themeTokens, commonTokens } from "../../components/embed/themes/theme-config";
import useSetting from "~settings/hook";
import { isInsideIframe } from "~utils/_embedded/iframe.utils";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import { IS_FOCUS_ACTIVE_CLS, THEME_MODES } from "~utils/theme/theme.constants";
import type { ThemeMode, ThemeContextState, ThemeContextValue } from "~utils/theme/theme.types";
import { resolveThemeMode, darkModePreference } from "~utils/theme/theme.utils";
import { ThemeContext } from "~utils/theme/theme.context";
import { MotionGlobalConfig } from "framer-motion";
import { postEmbeddedMessage } from "~utils/_embedded/utils/messages/embedded-messages.utils";
import { ARCONNECT_THEME_BACKGROUND_COLOR, ARCONNECT_THEME_TEXT_COLOR } from "~utils/storage.utils";

export function ThemeProvider({ children }: PropsWithChildren<{}>) {
  // User-defined setting, if any:

  const [themeSetting, setThemeSetting] = useSetting<ThemeMode>("display_theme");

  useAsyncEffect(async () => {
    const localStorage =
      import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? await LocalStorage.getInstance() : window.localStorage;

    // Delete old/duplicate theme localStorage value:
    localStorage.removeItem("theme");

    // These should have never been set for Connect:
    if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
      localStorage.removeItem(ARCONNECT_THEME_BACKGROUND_COLOR);
      localStorage.removeItem(ARCONNECT_THEME_TEXT_COLOR);
      window.localStorage.removeItem(ARCONNECT_THEME_BACKGROUND_COLOR);
      window.localStorage.removeItem(ARCONNECT_THEME_TEXT_COLOR);
    }
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

    // TODO: Update to use postEmbeddedMessage:
    window.parent.postMessage({ type: "THEME_CHANGE", data: themeState }, "*");
  }, [themeState]);

  // Reduced motion preference (for Framer Motion):

  useEffect(() => {
    const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion)");

    if (reducedMotionPreference.matches) {
      // This could also be always set to `true` at the top of the file and then set to `false` after the application
      // loads if we still notice some flicker due to any animation/transition playing when the view first loads.

      MotionGlobalConfig.skipAnimations = true;
    }
  }, []);

  // Focus active global class:

  useEffect(() => {
    function handleKeyDown({ code }: KeyboardEvent) {
      switch (code) {
        case "Tab": {
          document.documentElement.classList.add(IS_FOCUS_ACTIVE_CLS);
          break;
        }

        case "Escape": {
          const hadFocusActive = document.documentElement.classList.contains(IS_FOCUS_ACTIVE_CLS);

          document.documentElement.classList.remove(IS_FOCUS_ACTIVE_CLS);

          if (
            import.meta.env?.VITE_IS_EMBEDDED_APP === "1" &&
            (!hadFocusActive || document.activeElement === document.documentElement)
          ) {
            postEmbeddedMessage({
              type: "embedded_close",
              data: null,
            });
          }

          break;
        }
      }
    }

    function handleMouseDown({ target }: MouseEvent) {
      if (document.activeElement !== target) document.documentElement.classList.remove(IS_FOCUS_ACTIVE_CLS);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Memoize the context value for better performance:

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
}
