import { ListItem, Text } from "@wanderapp/components";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import LiquidOpsIcon from "url:/assets/ecosystem/liquidops.svg";
import { SvgImageWithBackground } from "./SvgImage";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { tokenData, type TokenData } from "liquidops";
import { useGateway } from "../liquidops/utils/hooks/useGateway";
import { useLOSupplyAPYs } from "../liquidops/utils/hooks/useLOSupplyAPY";
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
      style={{ width: "100%", textAlign: "left", padding: "12px 8px", borderRadius: "8px" }}
      expandedText={browser.i18n.getMessage("hide")}
      collapsedText={browser.i18n.getMessage("show")}
      expandable
      expandableContent={<SortedAgentsList tokens={availableTokens} activeTokens={activeTokens} navigate={navigate} />}
      onClick={() => {
        trackEvent(EventType.SELECT_AGENT, { agentType: "LiquidOps Agent" });
        navigate(PopupPaths.LiquidOpsAgentsList);
      }}
    />
  );
};

const SortedAgentsList = ({
  tokens,
  activeTokens,
  navigate,
}: {
  tokens: TokenData[];
  activeTokens: ActiveAgentToken[];
  navigate: ReturnType<typeof useLocation>["navigate"];
}) => {
  const queries = useLOSupplyAPYs(tokens.map((token) => token.ticker));

  const activeTokenMap = useMemo(() => {
    const map = new Map<string, ActiveAgentToken>();
    activeTokens?.forEach((token) => map.set(token.address, token));
    return map;
  }, [activeTokens]);

  const sortedTokensWithAPY = useMemo(() => {
    const tokensWithAPY = tokens.map((token, index) => ({
      token,
      apy: queries[index].data || 0,
      isActive: activeTokenMap.has(token.address),
      activeData: activeTokenMap.get(token.address),
    }));

    return tokensWithAPY.sort((a, b) => {
      // Active tokens first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      // Within same group, sort by APY (highest first)
      return b.apy - a.apy;
    });
  }, [tokens, queries, activeTokenMap]);

  return (
    <Flex direction="column" gap={16}>
      {sortedTokensWithAPY.map(({ token, apy, activeData }) => (
        <AgentListItem
          key={token.ticker}
          token={token}
          apy={apy}
          profit={activeData?.profit}
          onClick={() => {
            trackEvent(EventType.SELECT_AGENT, { agentType: "LiquidOps Agent" });
            navigate(`/agents/liquidops/${token.cleanTicker}${!activeData?.profit ? "/deposit" : ""}`);
          }}
        />
      ))}
    </Flex>
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
  apy,
  profit,
  ...rest
}: { token: TokenData; apy: number; profit?: BigNumber } & Partial<ComponentProps<typeof ListItem>>) => {
  const { data: icon } = useGateway(token.icon);

  const active = useMemo(() => typeof profit !== "undefined", [profit]);

  return (
    <ListItem
      key={token.ticker}
      title={<Title ticker={token.cleanTicker} apy={apy} />}
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
