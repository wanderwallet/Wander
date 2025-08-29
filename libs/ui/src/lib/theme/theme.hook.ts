import { useContext } from "react";
import { ThemeContext } from "./theme.context";

export const useTheme = () => useContext(ThemeContext);
