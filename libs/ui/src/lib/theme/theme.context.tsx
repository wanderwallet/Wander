import { createContext } from "react";
import type { ThemeContextValue } from "~utils/theme/theme.types";

export const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);
