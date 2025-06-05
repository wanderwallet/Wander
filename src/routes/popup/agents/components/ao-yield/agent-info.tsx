import styled from "styled-components";
import { Section, Text, ListItem, Loading, Button } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { PropertyName, PropertyValue, TransactionProperty } from "~routes/popup/transaction/[id]";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useAOYieldAgent, useAOYieldAgentInfo } from "~utils/agents/hooks";
import { assets } from "./AssetSelectorModal";
import { Divider } from "~components/Divider";
import { RemoveButton } from "~routes/popup/settings/wallets/[address]";
import { SvgImageWithBackground } from "../SvgImage";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { Settings01 } from "@untitled-ui/icons-react";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { AgentCancelModal } from "./AgentCancelModal";
import { WUSDC_PROCESS_ID } from "~tokens/aoTokens/ao";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { formatTokenQuantity, getStatusColor, getStatusText } from "~utils/agents/utils";
import type { MintingStatus } from "~utils/agents/types";

interface AgentInfoProps {
  agentId: string;
  headerTitle: string;
  mintingStatus?: MintingStatus;
  showEdit?: boolean;
  showCancel?: boolean;
  isHistory?: boolean;
}

export function AgentInfo({
  agentId,
  headerTitle,
  mintingStatus,
  showEdit = false,
  showCancel = false,
  isHistory = false,
}: AgentInfoProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const agent = useAOYieldAgent(agentId);
  const { data: agentInfo } = useAOYieldAgentInfo(agentId);
  const { navigate } = useLocation();

  const asset = useMemo(() => {
    if (!agent) return null;
    return assets.find((asset) => asset.id === agent.tokenOut);
  }, [agent]);

  const agentDetails = useMemo(() => {
    if (!agent || !asset) return [];

    const { conversionPercentage, startDate, endDate, runIndefinitely, slippage } = agent;
    const runningTime = runIndefinitely ? "∞" : `${dayjs(endDate).diff(dayjs(startDate), "day") + 1} days`;

    return [
      { name: "daily_conversion", value: `${conversionPercentage}% of AO earnings` },
      { name: "buy_asset", value: `${asset.ticker}` },
      { name: "running_time", value: runningTime },
      { name: "start_date", value: dayjs(startDate).format("MMM D, YYYY") },
      { name: "end_date", value: dayjs(endDate).format("MMM D, YYYY") },
      { name: "slippage", value: `${slippage}%` },
    ];
  }, [agent, asset]);

  const performanceDetails = useMemo(() => {
    if (!agentInfo || !asset) return [];

    const { totalAOSold, totalBought, totalTransactions, totalWanderFee } = agentInfo;
    const decimals = asset.id === WUSDC_PROCESS_ID ? 6 : 12;

    const details = [
      {
        name: "total_ao_sold",
        value: formatTokenQuantity(totalAOSold, decimals),
      },
      {
        name: `total_bought`,
        value: `${formatTokenQuantity(String(totalBought?.[asset?.id] || 0), decimals)} ${asset?.ticker}`,
      },
      { name: "total_transactions", value: totalTransactions },
    ];

    if (isHistory) {
      details.push({
        name: "total_wander_fee",
        value: `${formatTokenQuantity(totalWanderFee, decimals)} AO`,
      });
    }

    return details;
  }, [agentInfo, asset]);

  async function handleCancelAgent() {
    setShowCancelModal(true);
  }

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage(headerTitle)} />
      <Wrapper>
        <Content>
          <Flex gap={8} align="center" width="100%">
            <Text weight="medium" noMargin>
              {browser.i18n.getMessage("status")}
            </Text>
            <Flex gap={8} justify="space-between" width="100%">
              <Flex gap={8} align="center" justify="center" padding="6px 8px" background="#253327" borderRadius={8}>
                <div
                  style={{
                    height: 10,
                    width: 10,
                    borderRadius: "50%",
                    backgroundColor: getStatusColor(agent?.status, mintingStatus),
                  }}
                />
                <Text weight="semibold" noMargin>
                  {agent?.status && browser.i18n.getMessage(getStatusText(agent?.status, mintingStatus))}
                </Text>
              </Flex>
              {showEdit && (
                <Button
                  width={"80px"}
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
                    <PropertyName>{browser.i18n.getMessage(property.name, [asset?.ticker])}</PropertyName>
                    <PropertyValue>
                      {property.value}
                      {i === 0 && (
                        <SvgImageWithBackground height={18} width={18} src={aoLogo} iconSize={12} iconColor="black" />
                      )}
                      {i === 1 && asset?.logo && <img src={asset.logo} height={18} width={18} />}
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
                onClick={() =>
                  navigate(PopupPaths.AOYieldAgentTransactionHistory.replace(":id", agentId) as WanderRoutePath)
                }
                hideSquircle
                showArrow
              />
            </Flex>
          </Flex>
        </Content>
        {showCancel && (
          <Flex gap={8}>
            <RemoveButton onClick={handleCancelAgent} fullWidth>
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
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  height: 100%;
  gap: 16px;
`;
