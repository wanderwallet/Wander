export function addCSSVariables<T>(element: HTMLElement, vars: T, suffix = "") {
  for (const key in vars) {
    const value = vars[key];

    if (typeof value === "string") element.style.setProperty(`--${key}`, value);
    else if (typeof value === "number")
      element.style.setProperty(`--${key}${suffix}`, `${value}px`);
  }
}
