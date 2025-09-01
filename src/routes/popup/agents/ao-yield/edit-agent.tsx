import styled, { useTheme } from "styled-components";
import { Button, Section, Text, Tooltip, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { ChevronDown, HelpCircle } from "@untitled-ui/icons-react";
import { useEffect, useMemo, useState } from "react";
import { InputButton } from "~components/common/InputButton";
import { HorizontalLine } from "~components/HorizontalLine";
import { AssetSelectorModal } from "../components/ao-yield/AssetSelectorModal";
import { DateSelectorModal } from "../components/ao-yield/DateSelectorModal";
import type { Asset } from "~utils/agents/types";
import { assets, formatDate, getAOYieldActiveAgent, updateAOYieldAgent } from "~utils/agents/utils";
import { trackPage, PageType } from "~utils/analytics";
import { SlippageInputButton } from "~routes/popup/swap/components/SlippageInputButton";

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
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [initialSelection, setInitialSelection] = useState<"start" | "end">("start");

  const continueButtonDisabled = useMemo(() => {
    return !selectedAsset || !selectedSlippage || !startDate || !endDate;
  }, [selectedAsset, selectedSlippage, startDate, endDate]);

  const openAssetSelector = () => {
    setShowAssetSelector(true);
  };

  const closeAssetSelector = () => {
    setShowAssetSelector(false);
  };

  const openDateSelector = (selection: "start" | "end") => {
    setInitialSelection(selection);
    setShowDateSelector(true);
  };

  const closeDateSelector = () => {
    setShowDateSelector(false);
  };

  const handleDateSelect = (selectedStartDate: Date, selectedEndDate: Date) => {
    setStartDate(selectedStartDate);
    setEndDate(selectedEndDate);
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

  const handleCheckboxChange = () => {
    const newRunIndefinitely = !runIndefinitely;
    setRunIndefinitely(newRunIndefinitely);
    if (newRunIndefinitely) {
      setEndDate(new Date("9999-12-31"));
    } else {
      setEndDate(null);
    }
  };

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

    trackPage(PageType.AO_YIELD_AGENT_EDIT);
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
                    <Text size="lg" weight="medium" style={{ whiteSpace: "nowrap" }} noMargin>
                      {formatDate(startDate, "Start date")}
                    </Text>
                  }
                  onClick={() => openDateSelector("start")}
                  outerLabel
                />
                <Text variant="secondary" size="base" weight="semibold" noMargin>
                  -
                </Text>
                <InputButton
                  disabled={runIndefinitely}
                  style={{ background: theme.surfaceTertiary }}
                  body={
                    <Text size="lg" weight="medium" style={{ whiteSpace: "nowrap" }} noMargin>
                      {runIndefinitely ? "∞" : formatDate(endDate, "End date")}
                    </Text>
                  }
                  onClick={() => openDateSelector("end")}
                  outerLabel
                />
              </Flex>
            </Flex>
            <Flex direction="row" gap={8} align="center">
              <Checkbox checked={runIndefinitely} onChange={handleCheckboxChange} />
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
            <SlippageInputButton slippage={selectedSlippage} setSlippage={setSelectedSlippage} />
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
      <DateSelectorModal
        startDate={startDate}
        endDate={endDate}
        open={showDateSelector}
        onClose={closeDateSelector}
        onSelect={handleDateSelect}
        runIndefinitely={runIndefinitely}
        initialSelection={initialSelection}
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
  background-color: ${({ theme }) => (theme.displayTheme === "dark" ? "#2b2269" : "#E3D8F6")};
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
