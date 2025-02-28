import { css } from "styled-components";
import type { DisplayTheme } from "@arconnect/components";
import { useEffect, useState } from "react";
import useSetting from "~settings/hook";

type ThemeSetting = "light" | "dark" | "system";

const darkModePreference =
  typeof window === "undefined"
    ? null
    : window.matchMedia("(prefers-color-scheme: dark)");

function getInitialDisplayTheme(themeSetting: ThemeSetting): DisplayTheme {
  if (themeSetting !== "system") {
    // "light" or "dark"
    return themeSetting;
  }

  return darkModePreference.matches ? "dark" : "light";
}

export function useTheme() {
  const [themeSetting] = useSetting<ThemeSetting>("display_theme");

  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>(() => {
    return getInitialDisplayTheme(themeSetting);
  });

  useEffect(() => {
    setDisplayTheme(getInitialDisplayTheme(themeSetting));
  }, [themeSetting]);

  useEffect(() => {
    if (themeSetting !== "system") return;

    function handleDarkModePreferenceChange(e: MediaQueryListEvent) {
      setDisplayTheme(e.matches ? "dark" : "light");
    }

    darkModePreference.addEventListener(
      "change",
      handleDarkModePreferenceChange
    );

    return () =>
      darkModePreference.removeEventListener(
        "change",
        handleDarkModePreferenceChange
      );
  }, [themeSetting]);

  return displayTheme;
}

/**
 * Hover effect css
 * Applies a slight hue to the background of
 * the element without using background-color
 */
export const hoverEffect = css`
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    overflow: hidden;
    z-index: -1;
    transform: translate(-50%, -50%);
    transition: background-color 0.35s ease;
  }

  &:hover::after {
    background-color: rgba(${(props) => props.theme.theme}, 0.1);
  }

  &:active::after {
    background-color: rgba(${(props) => props.theme.theme}, 0.15);
  }
`;

export function getFormattedColor(color: string) {
  let formattedColor = "";
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    formattedColor = color;
  } else if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    formattedColor = `#${color}`;
  } else if (/^\d{1,3}, ?\d{1,3}, ?\d{1,3}$/.test(color)) {
    formattedColor = `rgb(${color})`;
  } else if (/^\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?.+$/.test(color)) {
    formattedColor = `rgba(${color})`;
  }
  return formattedColor;
}
