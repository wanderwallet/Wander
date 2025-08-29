import type { ThemeMode } from "~utils/theme/theme.types";

export const THEME_MODES = ["light", "dark", "system"] as const satisfies ThemeMode[];

export const IS_FOCUS_ACTIVE_CLS = "isFocusActive";
