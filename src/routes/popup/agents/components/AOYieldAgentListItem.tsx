import { ListItem, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import WarIcon from "url:/assets/ecosystem/war.svg";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { SvgImageWithBackground } from "./SvgImage";
import type { AOYieldAgent } from "~utils/agents/types";
import { WAR_PROCESS_ID } from "~tokens/aoTokens/ao";
import dayjs from "dayjs";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { useAOMintingStatus, useAOYieldAgentInfo } from "~utils/agents/hooks";
import { getStatusColor, getStatusText, tokenIdNameMap } from "~utils/agents/utils";

interface AOYieldAgentListItemProps {
  aoAgent: AOYieldAgent;
  isHistory?: boolean;
}

export const AOYieldAgentListItem = ({ aoAgent, isHistory = false }: AOYieldAgentListItemProps) => {
  const { navigate } = useLocation();
  const { data: mintingStatus } = useAOMintingStatus();
  const { data: agentInfo } = useAOYieldAgentInfo(aoAgent?.id);

  return !!aoAgent ? (
    <ListItem
      title={
        <Flex justify="space-between" align="center" width="100%">
          <Text weight="semibold" noMargin>
            {isHistory ? `AO <> ${tokenIdNameMap[aoAgent?.tokenOut]}` : browser.i18n.getMessage("ao_yield_agent")}
          </Text>
          <Flex align="center" gap={4}>
            <div
              style={{
                height: 6,
                width: 6,
                borderRadius: "50%",
                backgroundColor: getStatusColor(getStatusText(aoAgent.status, mintingStatus)),
              }}
            />
            <Text size="sm" weight="medium" noMargin>
              {browser.i18n.getMessage(getStatusText(aoAgent.status, mintingStatus))}
            </Text>
          </Flex>
        </Flex>
      }
      subtitle={
        <Flex justify="space-between" align="center" width="100%">
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {dayjs(aoAgent.startDate).format("MMM D")} - {dayjs(aoAgent.endDate).format("MMM D")}
          </Text>
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {agentInfo?.totalTransactions || 0} transactions
          </Text>
        </Flex>
      }
      squircleSize={40}
      hideSquircle={true}
      icon={
        <Flex direction="row" style={{ width: 32, position: "relative" }}>
          <SvgImageWithBackground
            height={20}
            width={20}
            style={{ position: "absolute", top: -17, left: 2 }}
            src={aoLogo}
            iconSize={16}
            iconColor="black"
          />
          <img
            src={aoAgent.tokenOut === WAR_PROCESS_ID ? WarIcon : wUSDCIcon}
            height={24}
            width={24}
            style={{ position: "absolute", bottom: -19, right: -6 }}
          />
        </Flex>
      }
      active
      onClick={() =>
        isHistory
          ? navigate(PopupPaths.AOYieldAgentInfo.replace(":id", aoAgent.id) as WanderRoutePath)
          : aoAgent.status !== "Cancelled"
            ? navigate(PopupPaths.ManageAOYieldAgent)
            : navigate(PopupPaths.CreateAOYieldAgent)
      }
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
    />
  ) : (
    <ListItem
      title={browser.i18n.getMessage("ao_yield_agent")}
      subtitle={browser.i18n.getMessage("ao_yield_agent_description")}
      subtitleStyle={{ fontSize: 10, fontWeight: 500, lineHeight: "13px" }}
      squircleSize={40}
      hideSquircle={true}
      icon={
        <SvgImageWithBackground
          height={44}
          width={40}
          shape="hexagon"
          src={aoLogo}
          iconSize={24}
          iconColor="black"
          hasBorder
        />
      }
      active
      onClick={() => navigate(PopupPaths.CreateAOYieldAgent)}
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
    />
  );
};
