import { LinkExternal02 } from "@untitled-ui/icons-react";
import styled, { useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { TierTag } from "~components/popup/tier/TierTag";
import { HelpCircle, Mail01, VideoRecorder } from "@untitled-ui/icons-react";
import { useMemo } from "react";
import discordLogo from "url:/assets/setup/discord-logo.svg";
import { useActiveTier } from "~utils/tier/hooks";
import { tierNameToId, TierTypes } from "~utils/tier/constants";
import type { Icon } from "../../../../../libs/core-2/src/lib/utils/settings/setting";
import type { HTMLProps } from "react";

export function HelpListItems() {
  const { data: activeTier } = useActiveTier();
  const tierId = tierNameToId[activeTier?.tier || TierTypes.Core];

  const items = useMemo(
    () => [
      {
        name: "help_center",
        icon: HelpCircle,
        link: "https://www.wander.app/help",
      },
      {
        name: "discord",
        icon: DiscordIcon,
        link: "https://discord.gg/6VNeBtUASK",
        showFastest: tierId <= 2,
      },
      ...(tierId <= 2
        ? [
            {
              name: "email",
              icon: Mail01,
              link: "mailto:Hello@Wander.app",
              tier: TierTypes.Edge,
            },
          ]
        : []),
      ...(tierId === 1
        ? [
            {
              name: "video_support",
              icon: VideoRecorder,
              link: "https://calendly.com/hello-wander/30min",
              tier: TierTypes.Prime,
            },
          ]
        : []),
    ],
    [tierId],
  );

  const handleItemClick = (item: HelpItem) => {
    browser.tabs.create({ url: item.link });
  };

  return (
    <Flex direction="column" gap="12px" width="100%">
      {items.map((item) => (
        <HelpListItem key={item.name} item={item} onClick={() => handleItemClick(item)} />
      ))}
    </Flex>
  );
}

interface HelpItem {
  name: string;
  icon: Icon;
  link: string;
  tier?: TierTypes;
  showFastest?: boolean;
}

interface HelpListItemProps extends HTMLProps<HTMLDivElement> {
  item: HelpItem;
}

function HelpListItem({ item, ...props }: HelpListItemProps) {
  return (
    <ListItem
      height={40}
      title={
        <Flex gap={12} align="center">
          <Text size="md" weight="medium" noMargin>
            {browser.i18n.getMessage(item.name)}
          </Text>
          {item.showFastest && <FastestLabel>{browser.i18n.getMessage("fastest")}</FastestLabel>}
          {item.tier && <TierTag tier={item.tier} />}
        </Flex>
      }
      titleStyle={{ fontWeight: 500 }}
      hideSquircle
      active={false}
      rightIcon={<ExternalLinkIcon />}
      leftIcon={<ListItemIcon as={item.icon} />}
      showArrow={false}
      style={{ width: "100%" }}
      {...props}
    />
  );
}

const DiscordIcon = () => {
  const theme = useTheme();

  return (
    <img
      src={discordLogo}
      alt="discord"
      style={{
        height: "24px",
        width: "24px",
        objectFit: "contain",
        filter: theme.displayTheme === "light" ? "none" : "invert(1)",
      }}
    />
  );
};

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

const FastestLabel = styled.span`
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${(props) => props.theme.primary};
  color: ${(props) => props.theme.primaryText};
  line-height: 1.2;
`;
