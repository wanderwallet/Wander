export const initThemeBridge = () => {
  // Send current theme to parent
  const sendThemeToParent = (mode: string) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "EMBEDDED_THEME_UPDATE", mode }, "*");
    }
  };

  // Listen for theme changes from parent
  window.addEventListener("message", (event) => {
    if (event.data?.type === "PARENT_THEME_UPDATE") {
      // Update theme in your context
      // This assumes you have a global method or event system to update theme
      window.dispatchEvent(
        new CustomEvent("THEME_UPDATE", {
          detail: { mode: event.data.mode }
        })
      );
    }
  });

  // Detect system theme changes
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  darkModeMediaQuery.addEventListener("change", (e) => {
    const newTheme = e.matches ? "dark" : "light";
    window.dispatchEvent(
      new CustomEvent("THEME_UPDATE", {
        detail: { mode: "system", systemPreference: newTheme }
      })
    );
  });

  return { sendThemeToParent };
};
