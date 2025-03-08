import { ListItem } from "@arconnect/components-rebrand";
import type { Icon } from "~settings/setting";
import type { HTMLProps } from "react";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export interface SettingItemData {
  icon: Icon;
  displayName: string;
  active: boolean;
}

export function SettingListItem({
  displayName,
  icon,
  active,
  ...props
}: SettingItemData & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem
      height={40}
      title={browser.i18n.getMessage(displayName)}
      titleStyle={{ fontWeight: 500 }}
      hideSquircle
      active={active}
      rightIcon={<ExternalLinkIcon />}
      {...props}
    >
      <ListItemIcon as={icon} />
    </ListItem>
  );
}

const ListItemIcon = styled.div`
  height: 24px;
  width: 24px;
  color: ${(props) => props.theme.primaryText};
`;

const ExternalLinkIcon = styled(LinkExternal02)`
  height: 1.5rem;
  width: 1.5rem;
  color: ${(props) => props.theme.tertiaryText};
`;
