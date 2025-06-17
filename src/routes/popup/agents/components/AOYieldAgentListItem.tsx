import { ListItem, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import WarIcon from "url:/assets/ecosystem/war.png";
import wUSDCIcon from "url:/assets/ecosystem/wusdc.svg";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { SvgImageWithBackground } from "./SvgImage";
import type { AOYieldAgent } from "~utils/agents/types";
import { WAR_PROCESS_ID } from "~tokens/aoTokens/ao";
import dayjs from "dayjs";
import { useAOMintingStatus, useAOYieldAgentInfo } from "~utils/agents/hooks";
import { getStatusColor, getStatusText, tokenIdInfoMap, updateLocalAOYieldAgent } from "~utils/agents/utils";
import { useTheme } from "styled-components";
import styled from "styled-components";
import { EventType, trackEvent } from "~utils/analytics";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";

interface AOYieldAgentListItemProps {
  aoAgent: AOYieldAgent;
  isHistory?: boolean;
}

export const AOYieldAgentListItem = ({ aoAgent, isHistory = false }: AOYieldAgentListItemProps) => {
  const { navigate } = useLocation();
  const { data: mintingStatus } = useAOMintingStatus();
  const { data: agentInfo } = useAOYieldAgentInfo(aoAgent?.id);
  const theme = useTheme();

  useAsyncEffect(async () => {
    if (!aoAgent || !agentInfo || isHistory) return;

    try {
      if (aoAgent.totalTransactions !== agentInfo.totalTransactions) {
        await updateLocalAOYieldAgent(aoAgent.id, { totalTransactions: agentInfo.totalTransactions });
      }
    } catch (error) {
      console.error("Error updating AO Yield Agent total transactions", error);
    }
  }, [aoAgent, agentInfo, isHistory]);

  return !!aoAgent && ((!isHistory && aoAgent.status === "Active") || isHistory) ? (
    <StyledListItem
      isActive={aoAgent.status === "Active"}
      title={
        <Flex justify="space-between" align="center" width="100%">
          <Text weight="semibold" noMargin>
            {isHistory
              ? `AO <> ${tokenIdInfoMap[aoAgent?.tokenOut]?.ticker}`
              : browser.i18n.getMessage("ao_yield_agent")}
          </Text>
          <Flex align="center" gap={4}>
            <div
              style={{
                height: 6,
                width: 6,
                borderRadius: "50%",
                backgroundColor: getStatusColor(aoAgent.status, mintingStatus),
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
            {aoAgent?.totalTransactions || agentInfo?.totalTransactions || 0} transactions
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
            style={{
              position: "absolute",
              top: -17,
              left: 2,
              border: `1px solid ${theme.displayTheme === "dark" ? "#333333" : "#D6D6DD"}`,
            }}
            src={aoLogo}
            iconSize={16}
            iconColor="black"
          />
          <img
            src={aoAgent.tokenOut === WAR_PROCESS_ID ? WarIcon : wUSDCIcon}
            height={24}
            width={24}
            style={{ position: "absolute", bottom: -17, right: -6 }}
          />
        </Flex>
      }
      active
      onClick={() => {
        trackEvent(EventType.SELECT_AGENT, { agentType: "AO Yield Agent" });
        aoAgent.status === "Active"
          ? navigate(PopupPaths.ManageAOYieldAgent)
          : isHistory
            ? navigate(PopupPaths.AOYieldAgentInfo, { params: { id: aoAgent.id } })
            : navigate(PopupPaths.CreateAOYieldAgent);
      }}
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
      onClick={() => {
        trackEvent(EventType.SELECT_AGENT, { agentType: "AO Yield Agent" });
        navigate(PopupPaths.CreateAOYieldAgent);
      }}
      style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
    />
  );
};

const StyledListItem = styled(ListItem)<{ isActive: boolean }>`
  width: 100%;
  text-align: left;
  padding: 12px 8px;
  box-sizing: border-box;
  border: 1px solid transparent;
  transition: none;
  outline: none;
  margin: 0;

  ${({ isActive, theme }) =>
    isActive &&
    `
    background-color: rgba(${theme.displayTheme === "dark" ? "37, 51, 39" : "233, 252, 236"}, 0.5);
    border-color: rgb(${theme.displayTheme === "dark" ? "16, 65, 36" : "4, 170, 62"});
  `}
`;
