import { merge } from "ts-deepmerge";
import { ThemeSetting, ThemeVariant } from "../../wander-connect.types";

export function isThemeRecord<T>(
  cssVars: Partial<T> | Partial<Record<ThemeVariant, Partial<T>>>,
): cssVars is Partial<Record<ThemeVariant, Partial<T>>> {
  return !!(cssVars && typeof cssVars === "object" && ("light" in cssVars || "dark" in cssVars));
}

export function addCSSVariables<T extends Object>(element: HTMLElement, vars: T, suffix = "") {
  for (const key in vars) {
    const name = `--${key}${suffix}`;
    const value = vars[key];

    if (typeof value === "string") element.style.setProperty(name, value);
    else if (typeof value === "number") element.style.setProperty(name, `${value}px`);
  }
}

export function addCSSVariablesForTheme<T extends Object>(
  element: HTMLElement,
  vars: T | Record<ThemeVariant, T>,
  themeOption?: ThemeSetting,
) {
  if (!vars || Object.keys(vars).length === 0) return;

  if (isThemeRecord(vars)) {
    if (themeOption === "system") {
      addCSSVariables(element, vars.light, "Light");
      addCSSVariables(element, vars.dark, "Dark");
    } else if (themeOption === "dark") {
      addCSSVariables(element, vars.dark, "Light");
      addCSSVariables(element, vars.dark, "Dark");
    } else {
      addCSSVariables(element, vars.light, "Light");
      addCSSVariables(element, vars.light, "Dark");
    }
  } else {
    addCSSVariables(element, vars, "Light");
    addCSSVariables(element, vars, "Dark");
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

  return {
    light: cssVarsLight,
    dark: cssVarsDark,
  };
}
