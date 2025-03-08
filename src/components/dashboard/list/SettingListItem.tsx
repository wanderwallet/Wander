import { ListItem } from "@arconnect/components-rebrand";
import type { Icon } from "~settings/setting";
import browser from "webextension-polyfill";
import type { HTMLProps } from "react";
import styled, { type DefaultTheme } from "styled-components";

export interface SettingItemProps {
  icon: Icon;
  displayName: string;
  description: string;
  active: boolean;
  theme?: DefaultTheme;
}

export default function SettingListItem({
  displayName,
  description,
  icon,
  active,
  theme,
  ...props
}: SettingItemProps & HTMLProps<HTMLDivElement>) {
  const isReset = displayName === "setting_reset";

  return (
    <ListItem
      titleStyle={{
        fontWeight: 500,
        color: isReset
          ? "#F1655B"
          : active
          ? theme.primaryText
          : theme.secondaryText
      }}
      title={browser.i18n.getMessage(displayName)}
      active={active}
      hideSquircle
      icon={
        <ListItemIcon
          active={active}
          fail={isReset}
          style={{ height: 24, width: 24 }}
          as={icon}
        />
      }
      {...props}
    />
  );
}

const ListItemIcon = styled.div<{ active?: boolean; fail?: boolean }>`
  height: 24px;
  width: 24px;
  color: ${({ theme, active, fail }) =>
    fail ? "#F1655B" : active ? theme.primary : theme.secondaryText};
`;
