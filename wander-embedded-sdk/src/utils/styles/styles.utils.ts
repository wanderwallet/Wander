import { merge } from "ts-deepmerge";
import { isThemeRecord, ThemeSetting, ThemeVariant } from "../../wander-embedded.types";

export function addCSSVariables<T>(element: HTMLElement, vars: T, suffix = "") {
  for (const key in vars) {
    const name = `--${key}${suffix}`;
    const value = vars[key];

    if (typeof value === "string") element.style.setProperty(name, value);
    else if (typeof value === "number") element.style.setProperty(name, `${value}px`);
  }
}

export function mergeCSSVariablesOption<T extends Object>(
  cssVarsOption: undefined | Partial<T> | Partial<Record<ThemeVariant, Partial<T>>>,
  themeOption: undefined | ThemeSetting,
  defaultLightCssVars: T,
  defaultDarkCssVars: T,
): Record<ThemeVariant, T> {
  let cssVarsLight = defaultLightCssVars;
  let cssVarsDark = defaultDarkCssVars;

  if (cssVarsOption && Object.keys(cssVarsOption).length > 0) {
    if (isThemeRecord(cssVarsOption)) {
      cssVarsLight = merge(cssVarsLight, cssVarsOption?.light || {}) as T;
      cssVarsDark = merge(defaultDarkCssVars, cssVarsOption?.dark || {}) as T;
    } else if (themeOption === "dark") {
      cssVarsDark = merge(defaultDarkCssVars, cssVarsOption || {}) as T;
    } else {
      cssVarsLight = merge(cssVarsLight, cssVarsOption || {}) as T;
    }
  }

  if (themeOption === "light") cssVarsDark = cssVarsLight;
  if (themeOption === "dark") cssVarsLight = cssVarsDark;

  return {
    light: cssVarsLight,
    dark: cssVarsDark,
  };
}
