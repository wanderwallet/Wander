import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useRef } from "react";
import { themeTokens, commonTokens } from "../themes/theme-config";
import { EMBEDDED_THEME } from "~utils/embedded/iframe.utils";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  tokens: typeof themeTokens;
  common: typeof commonTokens;
}

const defaultContext: ThemeContextType = {
  mode: "system",
  setMode: () => {},
  isDarkMode: false,
  tokens: themeTokens,
  common: commonTokens,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const themeParam = new URLSearchParams(window.location.search).get("theme") as ThemeMode | null;
    if (themeParam && ["light", "dark", "system"].includes(themeParam)) return themeParam;

    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) return savedTheme;

    return "system";
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const applyTheme = (themeName: "light" | "dark") => {
      document.documentElement.setAttribute("data-theme", themeName);
      setIsDarkMode(themeName === "dark");
    };

    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      applyTheme(mediaQuery.matches ? "dark" : "light");

      const handleChange = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      applyTheme(mode);
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("theme", mode);

    if (window.parent !== window) {
      window.parent.postMessage({ type: "THEME_CHANGE", mode, isDarkMode }, "*");
    }
  }, [mode, isDarkMode]);

  const lastModeRef = useRef(mode);
  const setModeTimeoutIDRef = useRef(0);

  lastModeRef.current = mode;

  const handleSetMode = useCallback((mode: ThemeMode) => {
    const cover = document.getElementById("cover");

    if (mode === lastModeRef.current || !cover) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const appliedMode = mediaQuery.matches ? "dark" : "light";

    if (
      (mode === "system" && appliedMode === lastModeRef.current) ||
      (lastModeRef.current === "system" && appliedMode === mode)
    ) {
      // If mode is (`mode` arg) or was (`lastModeRef.current`) "system" and the
      // applied theme doesn't change, no need to show the cover, just update the state.
      setMode(mode);

      return;
    }

    window.clearTimeout(setModeTimeoutIDRef.current);
    cover.removeAttribute("aria-hidden");
    setMode(mode);
    setModeTimeoutIDRef.current = window.setTimeout(() => {
      cover.setAttribute("aria-hidden", "true");
    }, 230);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        isDarkMode,
        tokens: themeTokens,
        common: commonTokens,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
