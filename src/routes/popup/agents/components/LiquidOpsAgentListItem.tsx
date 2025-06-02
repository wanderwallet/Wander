import { ListItem, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import UsdaIcon from "url:/assets/ecosystem/usda.svg";
import LiquidOpsIcon from "url:/assets/ecosystem/liquidops.svg";
import WarIcon from "url:/assets/ecosystem/war.svg";
import { SvgImageWithBackground } from "./SvgImage";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { tokenData } from "liquidops";
import { findGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";

export const LiquidOpsAgentListItem = () => {
  const { navigate } = useLocation();

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const gateway = {
    host: "arweave.net",
    port: 443,
    protocol: "https",
  }; // TODO: await findGateway({ graphql: true });
  const gatewayUrl = concatGatewayURL(gateway);

  return (
    <ListItem
      title={browser.i18n.getMessage("liquidops_agent")}
      subtitle={browser.i18n.getMessage("liquidops_agent_description", ["0", "3"])}
      subtitleStyle={{ fontSize: 14, fontWeight: 500, lineHeight: "18.2px" }}
      squircleSize={40}
      hideSquircle={true}
      icon={<SvgImageWithBackground height={44} width={40} shape="hexagon" src={LiquidOpsIcon} iconSize={24} />}
      active
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
      expandedText={browser.i18n.getMessage("hide")}
      collapsedText={browser.i18n.getMessage("show")}
      expandable
      expandableContent={
        <Flex direction="column" gap={16}>
          {activeTokens.map((token) => (
            <ListItem
              title={<Title ticker={token.cleanTicker} apy="1.13" />}
              icon={<img src={`${gatewayUrl}/${token.icon}`} height={24} width={24} />}
              hideSquircle
              padding={0}
              subtitleExtra={<Status status="Inactive" />}
              onClick={() => navigate(`/agents/liquidops/${token.cleanTicker}`)}
            />
          ))}
        </Flex>
      }
      onClick={() => navigate(PopupPaths.LiquidOpsAgentsList)}
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
