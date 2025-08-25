import { DashboardIcon, MoonIcon, SunIcon } from "@iconicicons/react";
import { Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function Theme() {
  // theme
  const [theme, setTheme] = useSetting("display_theme");

  return (
    <>
      <Text heading>{browser.i18n.getMessage("choose_theme")}</Text>
      <ThemeOption active={theme === "light"} onClick={() => setTheme("light")}>
        <SunIcon />
        {browser.i18n.getMessage("light_theme")}
      </ThemeOption>
      <Spacer y={0.5} />
      <ThemeOption active={theme === "dark"} onClick={() => setTheme("dark")}>
        <MoonIcon />
        {browser.i18n.getMessage("dark_theme")}
      </ThemeOption>
      <Spacer y={0.5} />
      <ThemeOption active={theme === "system"} onClick={() => setTheme("system")}>
        <DashboardIcon />
        {browser.i18n.getMessage("system_theme")}
      </ThemeOption>
      <Spacer y={2.5} />
    </>
  );
}

const ThemeOption = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 500;
  padding: 1.35rem 1.45rem;
  color: rgb(${(props) => props.theme.theme});
  background-color: ${(props) => (props.active ? "rgba(" + props.theme.theme + ", .2)" : "transparent")};
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, ${(props) => (props.active ? ".2" : ".1")});
  }
`;
