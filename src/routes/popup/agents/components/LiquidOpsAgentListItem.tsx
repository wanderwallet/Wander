import { ListItem, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import UsdaIcon from "url:/assets/ecosystem/usda.svg";
import LiquidOpsIcon from "url:/assets/ecosystem/liquidops.svg";
import WarIcon from "url:/assets/ecosystem/war.svg";
import { SvgImage, SvgImageBackground } from "./SvgImage";

export const LiquidOpsAgentListItem = () => {
  return (
    <ListItem
      title={browser.i18n.getMessage("liquidops_agent")}
      subtitle={browser.i18n.getMessage("liquidops_agent_description", ["0", "3"])}
      subtitleStyle={{ fontSize: 14, fontWeight: 500, lineHeight: "18.2px" }}
      squircleSize={40}
      hideSquircle={true}
      icon={
        <Flex borderRadius="50%" align="center" justify="center" height={40} width={40} overflow="hidden">
          <img src={LiquidOpsIcon} alt="LiquidOps" style={{ transform: "scale(1.3)" }} />
        </Flex>
      }
      active
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
      expandedText={browser.i18n.getMessage("hide")}
      collapsedText={browser.i18n.getMessage("show")}
      expandable
      expandableContent={
        <Flex direction="column" gap={16}>
          <ListItem
            title={<Title ticker="AO" apy="1.13" />}
            icon={
              <SvgImageBackground size={24}>
                <SvgImage src={aoLogo} size={16} />
              </SvgImageBackground>
            }
            hideSquircle
            padding={0}
            subtitleExtra={<Status status="Inactive" />}
          />
          <ListItem
            title={<Title ticker="USDA" apy="3.43" />}
            icon={<img src={UsdaIcon} height={24} width={24} />}
            hideSquircle
            padding={0}
            subtitleExtra={<Status status="Inactive" />}
          />
          <ListItem
            title={<Title ticker="wAR" apy="1.57" />}
            icon={<img src={WarIcon} height={24} width={24} />}
            hideSquircle
            padding={0}
            subtitleExtra={<Status status="Inactive" />}
          />
        </Flex>
      }
    />
  );
};

const Title = ({ ticker, apy }: { ticker: string; apy: string }) => (
  <Flex direction="row" gap={4} align="center">
    <Text size="md" weight="semibold" noMargin>
      {ticker}
    </Text>
    <Text variant="secondary" size="sm" weight="medium" noMargin>
      {apy}% APY
    </Text>
  </Flex>
);

const Status = ({ status }: { status: string }) => (
  <Text variant="tertiary" weight="medium" noMargin>
    {status}
  </Text>
);
