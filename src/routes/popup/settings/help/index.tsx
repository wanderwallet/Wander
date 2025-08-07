import { HelpCircle, Mail01, VideoRecorder, LinkExternal02 } from "@untitled-ui/icons-react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import HeadV2 from "~components/popup/HeadV2";
import { useActiveTier } from "~utils/tier/hooks";
import discordLogo from "url:/assets/setup/discord-logo.svg";
import { ListItem, Text } from "@arconnect/components-rebrand";
import type { Icon } from "~settings/setting";
import { useMemo, type HTMLProps } from "react";
import { TierTag } from "~components/popup/tier/TierTag";
import { tierNameToId, TierTypes } from "~utils/tier/constants";

export function HelpView() {
  const { data: activeTier } = useActiveTier();
  const tierId = tierNameToId[activeTier?.tier || TierTypes.Core];

  const items: SettingItem[] = useMemo(
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

  const handleItemClick = (setting: SettingItem) => {
    browser.tabs.create({ url: setting.link });
  };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("help")} showOptions={false} />
      <Wrapper>
        <Flex direction="column" gap="12px">
          {items.map((setting) => (
            <SettingListItem
              name={setting.name}
              icon={setting.icon}
              tier={setting.tier}
              showFastest={setting.showFastest}
              active={false}
              onClick={() => handleItemClick(setting)}
              key={setting.name}
            />
          ))}
        </Flex>
      </Wrapper>
    </>
  );
}

function SettingListItem({
  name,
  icon,
  active,
  tier,
  showFastest,
  ...props
}: SettingItemData & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem
      height={40}
      title={
        <Flex gap={12} align="center">
          <Text size="md" weight="medium" noMargin>
            {browser.i18n.getMessage(name)}
          </Text>
          {showFastest && <FastestLabel>{browser.i18n.getMessage("fastest")}</FastestLabel>}
          {tier && <TierTag tier={tier} />}
        </Flex>
      }
      titleStyle={{ fontWeight: 500 }}
      hideSquircle
      active={active}
      rightIcon={<ExternalLinkIcon />}
      leftIcon={<ListItemIcon as={icon} />}
      showArrow={false}
      {...props}
    />
  );
}

interface SettingItemData {
  icon: Icon;
  name: string;
  active: boolean;
  tier?: TierTypes;
  showFastest?: boolean;
}

interface SettingItem {
  name: string;
  icon: Icon;
  link: string;
  tier?: TierTypes;
  showFastest?: boolean;
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

const FastestLabel = styled.span`
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${(props) => props.theme.primary};
  color: ${(props) => props.theme.primaryText};
  line-height: 1.2;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 70px);
`;

const DiscordImage = styled.img`
  height: 24px;
  width: 24px;
  object-fit: contain;
  filter: ${(props) => (props.theme.displayTheme === "light" ? "none" : "invert(1)")};
`;

const DiscordIcon = () => <DiscordImage src={discordLogo} alt="discord" />;
