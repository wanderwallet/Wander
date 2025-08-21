import { useContext } from "react";
import { ThemeContext } from "~utils/theme/theme.context";

export const useTheme = () => useContext(ThemeContext);
