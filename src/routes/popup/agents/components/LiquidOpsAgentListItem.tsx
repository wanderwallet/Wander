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
import { useActiveTokens } from "../liquidops/utils/hooks/useAvailableTokens";
import { useTokenStatus } from "../liquidops/utils/hooks/useTokenStatus";
import type { ComponentProps } from "react";

export const LiquidOpsAgentListItem = () => {
  const { navigate } = useLocation();

  const availableTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const { data: activeTokens } = useActiveTokens();

  return (
    <ListItem
      title={browser.i18n.getMessage("liquidops_agent")}
      subtitle={browser.i18n.getMessage("liquidops_agent_description", [
        (activeTokens?.length ?? 0).toString(),
        availableTokens.length.toString(),
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
          {availableTokens.map((token) => (
            <AgentListItem token={token} onClick={() => navigate(`/agents/liquidops/${token.cleanTicker}`)} />
          ))}
        </Flex>
      }
      onClick={() => navigate(PopupPaths.LiquidOpsAgentsList)}
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

const Status = ({ status }: { status: boolean }) => (
  <Text variant="tertiary" weight="medium" noMargin>
    {status ? "Active" : "Inactive"}
  </Text>
);

const AgentListItem = ({ token, ...rest }: { token: TokenData } & Partial<ComponentProps<typeof ListItem>>) => {
  const { data: supplyAPY } = useLOSupplyAPY(token.ticker);
  const { data: icon } = useGateway(token.icon);
  const { hasToken } = useTokenStatus(token.ticker);

  return (
    <ListItem
      key={token.ticker}
      title={<Title ticker={token.cleanTicker} apy={supplyAPY || 0} />}
      icon={<img src={icon} height={24} width={24} />}
      hideSquircle
      padding={0}
      subtitleExtra={<Status status={hasToken} />}
      {...rest}
    />
  );
};
