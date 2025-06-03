import styled, { useTheme } from "styled-components";
import { Button, Section, Text, Tooltip, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { ChevronDown, HelpCircle } from "@untitled-ui/icons-react";
import { useEffect, useMemo, useState } from "react";
import { InputButton } from "~components/common/InputButton";
import { HorizontalLine } from "~components/HorizontalLine";
import { assets, AssetSelectorModal } from "../components/ao-yield/AssetSelectorModal";
import { SlippageSelectorModal } from "../components/ao-yield/SlippageSelectorModal";
import { DateSelectorModal } from "../components/ao-yield/DateSelectorModal";
import type { Asset } from "~utils/agents/types";
import { getAOYieldActiveAgent, updateAOYieldAgent } from "~utils/agents/utils";

export function EditAOYieldAgentView() {
  const theme = useTheme();
  const toasts = useToasts();
  const [isLoading, setIsLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const [selectedSlippage, setSelectedSlippage] = useState(0.5);
  const [runIndefinitely, setRunIndefinitely] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showSlippageSelector, setShowSlippageSelector] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);

  const continueButtonDisabled = useMemo(() => {
    return !selectedAsset || !selectedSlippage || !startDate || !endDate;
  }, [selectedAsset, selectedSlippage, startDate, endDate]);

  const openAssetSelector = () => {
    setShowAssetSelector(true);
  };

  const closeAssetSelector = () => {
    setShowAssetSelector(false);
  };

  const openSlippageSelector = () => {
    setShowSlippageSelector(true);
  };

  const closeSlippageSelector = () => {
    setShowSlippageSelector(false);
  };

  const openDateSelector = () => {
    setShowDateSelector(true);
  };

  const closeDateSelector = () => {
    setShowDateSelector(false);
  };

  const handleDateSelect = (selectedStartDate: Date, selectedEndDate: Date) => {
    setStartDate(selectedStartDate);
    setEndDate(selectedEndDate);
  };

  const formatDateRange = (type: "start" | "end" = "start") => {
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    if (startDate && type === "start") {
      return startDate.toLocaleDateString("en-US", formatOptions);
    } else if (endDate && type === "end") {
      return endDate.toLocaleDateString("en-US", formatOptions);
    }

    return type === "start" ? "Start date" : "End date";
  };

  async function handleSave() {
    if (!agentId) return;

    try {
      setIsLoading(true);
      await updateAOYieldAgent(agentId, {
        slippage: selectedSlippage,
        tokenOut: selectedAsset.id,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        runIndefinitely,
      });

      toasts.setToast({
        content: browser.i18n.getMessage("agent_updated"),
        type: "success",
        duration: 2400,
      });
    } catch {
      toasts.setToast({
        content: browser.i18n.getMessage("error_updating_agent"),
        type: "error",
        duration: 2400,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (runIndefinitely) {
      setEndDate(new Date("9999-12-31"));
    } else {
      setEndDate(null);
    }
  }, [runIndefinitely]);

  useEffect(() => {
    getAOYieldActiveAgent().then((agent) => {
      if (agent) {
        const asset = assets.find((asset) => asset.id === agent.tokenOut);
        setAgentId(agent.id);
        setSelectedAsset(asset || assets[0]);
        setSelectedSlippage(agent.slippage);
        setRunIndefinitely(agent.runIndefinitely);
        setStartDate(new Date(agent.startDate));
        setEndDate(new Date(agent.endDate));
      }
    });
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("edit_agent")} />
      <Wrapper>
        <Content>
          <Flex direction="column" gap={16}>
            <InputButton
              style={{ background: theme.surfaceTertiary }}
              label={browser.i18n.getMessage("buy_asset")}
              onClick={openAssetSelector}
              disabled={!selectedAsset}
              body={
                <Flex direction="row" gap={8} align="center">
                  <img src={selectedAsset.logo} height={24} width={24} />
                  <Text size="lg" weight="medium" noMargin>
                    {selectedAsset.ticker}
                  </Text>
                </Flex>
              }
              icon={
                <Flex align="center" justify="center">
                  <ChevronDown onClick={openAssetSelector} />
                </Flex>
              }
              outerLabel
            />
            <Flex direction="column" gap={8}>
              <Text noMargin>{browser.i18n.getMessage("running_time")}</Text>
              <Flex direction="row" gap={8} align="center">
                <InputButton
                  style={{ background: theme.surfaceTertiary }}
                  body={
                    <Text size="lg" weight="medium" noMargin>
                      {formatDateRange()}
                    </Text>
                  }
                  onClick={openDateSelector}
                  outerLabel
                />
                <Text variant="secondary" size="base" weight="semibold" noMargin>
                  -
                </Text>
                <InputButton
                  style={{ background: theme.surfaceTertiary }}
                  body={
                    <Text size="lg" weight="medium" noMargin>
                      {runIndefinitely ? "∞" : formatDateRange("end")}
                    </Text>
                  }
                  onClick={openDateSelector}
                  outerLabel
                />
              </Flex>
            </Flex>
            <Flex direction="row" gap={8} align="center">
              <Checkbox checked={runIndefinitely} onChange={() => setRunIndefinitely((prev) => !prev)} />
              <Text size="sm" weight="medium" noMargin>
                {browser.i18n.getMessage("run_indefinitely")}
              </Text>
              <Tooltip
                underline
                content={
                  <Text size="sm" weight="medium" style={{ maxWidth: "180px", textAlign: "center" }} noMargin>
                    {browser.i18n.getMessage("run_indefinitely_tooltip")}
                  </Text>
                }
                position="top">
                <HelpCircle height={16} width={16} color={theme.tertiaryText} />
              </Tooltip>
            </Flex>
            <HorizontalLine />
            <InputButton
              style={{ background: theme.surfaceTertiary }}
              onClick={openSlippageSelector}
              disabled={false}
              innerStyle={{ width: "100%" }}
              body={
                <Flex direction="row" gap={8} align="center" justify="space-between">
                  <Text size="lg" weight="medium" noMargin>
                    {browser.i18n.getMessage("slippage")}
                  </Text>
                  <Flex align="center" justify="center" gap={4}>
                    {selectedSlippage === 0.5 && <Tag>{browser.i18n.getMessage("auto")}</Tag>}
                    <Text weight="medium" noMargin>
                      {selectedSlippage}%
                    </Text>
                  </Flex>
                </Flex>
              }
              icon={
                <Flex align="center" justify="center">
                  <ChevronDown onClick={openSlippageSelector} />
                </Flex>
              }
              outerLabel
            />
          </Flex>
        </Content>
        <Flex gap={8}>
          <Button disabled={continueButtonDisabled || isLoading} onClick={handleSave} loading={isLoading} fullWidth>
            {browser.i18n.getMessage("save")}
          </Button>
        </Flex>
      </Wrapper>
      <AssetSelectorModal
        open={showAssetSelector}
        onClose={closeAssetSelector}
        selectedAsset={selectedAsset}
        onSelect={setSelectedAsset}
      />
      <SlippageSelectorModal
        open={showSlippageSelector}
        onClose={closeSlippageSelector}
        slippage={selectedSlippage}
        onSelect={setSelectedSlippage}
      />
      <DateSelectorModal
        startDate={startDate}
        endDate={endDate}
        open={showDateSelector}
        onClose={closeDateSelector}
        onSelect={handleDateSelect}
      />
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
`;

const Tag = styled.div`
  padding: 4px 8px;
  border-radius: 50px;
  background-color: #2b2269;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.secondaryText};
`;

const Checkbox = styled.input.attrs({ type: "checkbox" })`
  height: 16px;
  width: 16px;
  accent-color: ${({ theme }) => theme.primary};
  cursor: "pointer";
  display: "flex";
  padding: "1px";
  justify-content: "center";
  align-items: "center";
  border-radius: "3.556px";
  border: 1px solid ${({ theme }) => theme.primary};
  background: ${({ theme }) => theme.primary};
  cursor: pointer;
`;
