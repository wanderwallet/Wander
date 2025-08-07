import styled from "styled-components";
import { Section, Text, ListItem, Loading, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { PropertyName, PropertyValue, TransactionProperty } from "~routes/popup/transaction/[id]";
import { useMemo, useState } from "react";
import { useAOYieldAgent, useAOYieldAgentInfo, useAOYieldAgentProperties } from "~utils/agents/hooks";
import { Divider } from "~components/Divider";
import { RemoveButton } from "~routes/popup/settings/wallets/[address]";
import { SvgImageWithBackground } from "../SvgImage";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { Settings01 } from "@untitled-ui/icons-react";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { AgentCancelModal } from "./AgentCancelModal";
import {
  assets,
  formatTokenQuantity,
  getStatusColor,
  getStatusText,
  updateLocalAOYieldAgent,
} from "~utils/agents/utils";
import type { MintingStatus } from "~utils/agents/types";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { EventType, trackEvent } from "~utils/analytics";

interface AgentInfoProps {
  agentId: string;
  headerTitle: string;
  mintingStatus?: MintingStatus;
  isHistory?: boolean;
}

export function AgentInfo({ agentId, headerTitle, mintingStatus, isHistory = false }: AgentInfoProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const agent = useAOYieldAgent(agentId);
  const { data: agentInfo } = useAOYieldAgentInfo(agentId);
  const { navigate, previousLocation } = useLocation();

  const asset = useMemo(() => {
    if (!agent) return null;
    return assets.find((asset) => asset.id === agent.tokenOut);
  }, [agent]);

  const agentDetails = useAOYieldAgentProperties(agent);

  const performanceDetails = useMemo(() => {
    if (!agentInfo || !asset) return [];

    const { totalAOSold, totalBought, totalTransactions, totalWanderFee } = agentInfo;

    const totalBoughtKeys = Object.keys(totalBought || {});
    const containsBothAssets = totalBoughtKeys.length > 1 || (totalBoughtKeys[0] && totalBoughtKeys[0] !== asset.id);

    const details = [
      {
        name: "total_ao_sold",
        value: formatTokenQuantity(totalAOSold, 12),
        logo: undefined,
        substitutions: [],
      },
      ...(containsBothAssets
        ? assets.map((a) => ({
            name: `total_bought`,
            value: `${formatTokenQuantity(String(totalBought?.[a.id] || 0), a.denomination)}`,
            substitutions: [a.ticker],
            logo: a.logo,
          }))
        : [
            {
              name: `total_bought`,
              value: `${formatTokenQuantity(String(totalBought?.[asset?.id] || 0), asset.denomination)}`,
              substitutions: [asset?.ticker],
              logo: asset?.logo,
            },
          ]),
      { name: "total_transactions", value: totalTransactions, logo: undefined, substitutions: [] },
    ];

    if (isHistory) {
      details.push({
        name: "total_wander_fee",
        value: `${formatTokenQuantity(totalWanderFee, 12)} AO`,
        logo: undefined,
        substitutions: [],
      });
    }

    return details;
  }, [agentInfo, asset]);

  async function handleCancelAgent() {
    setShowCancelModal(true);
  }

  useAsyncEffect(async () => {
    if (!agent || !agentInfo) return;

    try {
      if (agent.status === "Active" && agent.status !== agentInfo.status) {
        const isCompleted = agent.status === "Active" && agentInfo.status === "Completed";
        const updated = await updateLocalAOYieldAgent(agentId, { status: agentInfo.status });
        if (updated && isCompleted) {
          await trackEvent(EventType.AO_YIELD_AGENT_END, {});
        }
      }
    } catch (error) {
      console.error("Error updating AO Yield Agent status", error);
    }
  }, [agent, agentInfo]);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage(headerTitle)}
        back={
          !isHistory
            ? () => {
                if (previousLocation === "/agents/ao-yield/history" || previousLocation.startsWith("/tokens/")) {
                  navigate(previousLocation);
                } else {
                  navigate("/agents");
                }
              }
            : undefined
        }
      />
      <Wrapper>
        <Content>
          <Flex gap={8} align="center" width="100%">
            <Text weight="medium" noMargin>
              {browser.i18n.getMessage("status")}
            </Text>
            <Flex gap={8} justify="space-between" width="100%">
              <StatusBade variant="secondary" width="max-content">
                <div
                  style={{
                    height: 10,
                    width: 10,
                    borderRadius: "50%",
                    backgroundColor: getStatusColor(agent?.status, mintingStatus),
                    flexShrink: 0,
                  }}
                />
                <Text weight="semibold" noMargin>
                  {agent?.status && browser.i18n.getMessage(getStatusText(agent?.status, mintingStatus))}
                </Text>
              </StatusBade>
              {!isHistory && (
                <Button
                  width={"80px"}
                  disabled={agent?.status !== "Active"}
                  variant="secondary"
                  icon={<Settings01 height={20} width={20} />}
                  iconPosition="right"
                  style={{ padding: "8px 12px", height: 36 }}
                  onClick={() => navigate(PopupPaths.EditAOYieldAgent)}>
                  {browser.i18n.getMessage("edit")}
                </Button>
              )}
            </Flex>
          </Flex>
          <Flex direction="column" gap={16}>
            <Text size="md" weight="semibold" noMargin>
              {browser.i18n.getMessage("agent_details")}
            </Text>
            <Flex direction="column" gap={8}>
              {agentDetails.map((property, i) => (
                <TransactionProperty key={`property-${i}`}>
                  <PropertyName>{browser.i18n.getMessage(property.name)}</PropertyName>
                  <PropertyValue>
                    {property.value}
                    {i === 1 && asset?.logo && <img src={asset.logo} height={18} width={18} />}
                  </PropertyValue>
                </TransactionProperty>
              ))}
            </Flex>
          </Flex>
          <Divider />
          <Flex direction="column" gap={16}>
            <Text size="md" weight="semibold" noMargin>
              {browser.i18n.getMessage("performance")}
            </Text>
            <Flex direction="column" gap={8}>
              {performanceDetails.length > 0 ? (
                performanceDetails.map((property, i) => (
                  <TransactionProperty key={`property-${i}`}>
                    <PropertyName>{browser.i18n.getMessage(property.name, property.substitutions)}</PropertyName>
                    <PropertyValue>
                      {property.value}
                      {i === 0 && (
                        <SvgImageWithBackground height={18} width={18} src={aoLogo} iconSize={12} iconColor="black" />
                      )}
                      {(i === 1 || i == 2) && property?.logo && <img src={property.logo} height={18} width={18} />}
                    </PropertyValue>
                  </TransactionProperty>
                ))
              ) : (
                <Loading style={{ height: 16, width: 18, alignSelf: "center" }} />
              )}
              <ListItem
                title={browser.i18n.getMessage("view_transaction_history")}
                titleStyle={{ fontSize: 14, fontWeight: 500 }}
                style={{ padding: "4px 0px 4px 4px" }}
                onClick={() => navigate(PopupPaths.AOYieldAgentTransactionHistory, { params: { id: agentId } })}
                hideSquircle
                showArrow
              />
            </Flex>
          </Flex>
        </Content>
        {!isHistory && (
          <Flex gap={8}>
            <RemoveButton onClick={handleCancelAgent} fullWidth disabled={agent?.status !== "Active"}>
              {browser.i18n.getMessage("cancel_agent")}
            </RemoveButton>
          </Flex>
        )}
      </Wrapper>
      <AgentCancelModal open={showCancelModal} onClose={() => setShowCancelModal(false)} agentId={agentId} />
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  height: calc(100vh - 100px);
  background-color: ${({ theme }) => theme.background};
  gap: 16px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  height: 100%;
  padding-bottom: 16px;
  gap: 16px;
`;

const StatusBade = styled(Button)`
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 8px;
  background: ${({ theme }) => theme.displayTheme === "dark" && "#253327"};
  height: 36px;
  pointer-events: none;
`;
