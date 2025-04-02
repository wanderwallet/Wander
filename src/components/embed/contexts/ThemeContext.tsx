import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode
} from "react";
import { themeTokens, commonTokens } from "../themes/theme-config";

type ThemeMode = "light" | "dark" | "system";

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
  common: commonTokens
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("system");
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
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get("theme") as ThemeMode | null;

    if (themeParam && ["light", "dark", "system"].includes(themeParam)) {
      setMode(themeParam);
      return;
    }

    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setMode(savedTheme);
      return;
    }

    setMode("system");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", mode);

    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "THEME_CHANGE", mode, isDarkMode },
        "*"
      );
    }
  }, [mode, isDarkMode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        isDarkMode,
        tokens: themeTokens,
        common: commonTokens
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
