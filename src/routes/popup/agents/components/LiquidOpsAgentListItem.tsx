import { ListItem, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import LiquidOpsIcon from "url:/assets/ecosystem/liquidops.svg";
import { SvgImageWithBackground } from "./SvgImage";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { tokenData, type TokenData } from "liquidops";
import { useGateway } from "../liquidops/utils/hooks/useGateway";
import { useLOSupplyAPY } from "../liquidops/utils/hooks/useLOSupplyAPY";
import { type ActiveAgentToken } from "../liquidops/utils/hooks/useAvailableTokens";
import { useMemo, type ComponentProps } from "react";
import BigNumber from "bignumber.js";
import { formatNumber } from "../liquidops/utils/format";
import { EventType, trackEvent } from "~utils/analytics";

interface Props {
  activeTokens: ActiveAgentToken[];
}

export const LiquidOpsAgentListItem = ({ activeTokens }: Props) => {
  const { navigate } = useLocation();

  const availableTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const activeCount = useMemo(() => activeTokens?.length || 0, [activeTokens]);

  return (
    <ListItem
      title={browser.i18n.getMessage("liquidops_agent")}
      subtitle={browser.i18n.getMessage("liquidops_agent_description", [
        activeCount.toString(),
        (availableTokens.length - activeCount).toString(),
      ])}
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
          {availableTokens.map((token) => {
            const activeData = activeTokens && activeTokens.find((t) => t.address === token.address);

            return (
              <AgentListItem
                token={token}
                profit={activeData?.profit}
                onClick={() => {
                  trackEvent(EventType.SELECT_AGENT, { agentType: "LiquidOps Agent" });
                  navigate(`/agents/liquidops/${token.cleanTicker}${!activeData?.profit ? "/deposit" : ""}`);
                }}
              />
            );
          })}
        </Flex>
      }
      onClick={() => {
        trackEvent(EventType.SELECT_AGENT, { agentType: "LiquidOps Agent" });
        navigate(PopupPaths.LiquidOpsAgentsList);
      }}
    />
  );
};

const Title = ({ ticker, apy }: { ticker: string; apy: number }) => (
  <Flex direction="row" gap={4} align="center">
    <Text size="md" weight="semibold" noMargin>
      {ticker}
    </Text>
    <Text variant="secondary" size="sm" weight="medium" noMargin>
      {apy.toLocaleString(undefined, { maximumFractionDigits: 2 })}% APY
    </Text>
  </Flex>
);

const AgentListItem = ({
  token,
  profit,
  ...rest
}: { token: TokenData; profit?: BigNumber } & Partial<ComponentProps<typeof ListItem>>) => {
  const { data: supplyAPY = 0 } = useLOSupplyAPY(token.ticker);
  const { data: icon } = useGateway(token.icon);

  const active = useMemo(() => typeof profit !== "undefined", [profit]);

  return (
    <ListItem
      key={token.ticker}
      title={<Title ticker={token.cleanTicker} apy={supplyAPY} />}
      icon={<img src={icon} height={24} width={24} />}
      hideSquircle
      padding={0}
      subtitleExtra={
        <Text variant="tertiary" weight="medium" noMargin style={active ? { color: "rgb(86, 201, 128)" } : {}}>
          {active ? "+" + formatNumber(profit || BigNumber(0)) : "Inactive"}
        </Text>
      }
      {...rest}
    />
  );
};
