import styled, { useTheme } from "styled-components";
import { Button, Section, Text, Tooltip } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { ChevronDown, ClockRewind, HelpCircle } from "@untitled-ui/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "~components/Slider";
import { InputButton } from "~components/common/InputButton";
import { HorizontalLine } from "~components/HorizontalLine";
import { AssetSelectorModal } from "../components/ao-yield/AssetSelectorModal";
import { SlippageSelectorModal } from "../components/ao-yield/SlippageSelectorModal";
import { DateSelectorModal } from "../components/ao-yield/DateSelectorModal";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { TempTransactionStorage } from "~utils/storage";
import type { AOYieldAgentCreate, Asset } from "~utils/agents/types";
import { assets, formatDate } from "~utils/agents/utils";
import { trackPage, PageType } from "~utils/analytics";
import { AODelegationModal } from "../components/AODelegationModal";

export function CreateAOYieldAgentView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const [percentage, setPercentage] = useState(50);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const [selectedSlippage, setSelectedSlippage] = useState(0.5);
  const [runIndefinitely, setRunIndefinitely] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showSlippageSelector, setShowSlippageSelector] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [initialSelection, setInitialSelection] = useState<"start" | "end">("start");

  const continueButtonDisabled = useMemo(() => {
    return !selectedAsset || !selectedSlippage || !startDate || !endDate || !percentage;
  }, [selectedAsset, selectedSlippage, startDate, endDate, percentage]);

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

  const handleContinue = () => {
    TempTransactionStorage.set("ao-yield-agent", {
      conversionPercentage: percentage,
      asset: selectedAsset,
      slippage: selectedSlippage,
      runIndefinitely,
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    });
    navigate(PopupPaths.ConfirmAOYieldAgent);
  };

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
    trackPage(PageType.AO_YIELD_AGENT_CREATE);

    const restoreFormState = async () => {
      const savedData = await TempTransactionStorage.get<AOYieldAgentCreate>("ao-yield-agent");
      if (savedData) {
        setPercentage(savedData.conversionPercentage || 50);
        setSelectedAsset(savedData.asset || assets[0]);
        setSelectedSlippage(savedData.slippage || 0.5);
        setRunIndefinitely(savedData.runIndefinitely || false);
        if (savedData.startDate) setStartDate(new Date(savedData.startDate));
        if (savedData.endDate) setEndDate(new Date(savedData.endDate));
      }
    };

    restoreFormState();
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("ao_yield_agent")} back={() => navigate(PopupPaths.Agents)} />
      <Wrapper>
        <Content>
          <Flex direction="column" gap={16} padding="16px 8px">
            <Flex direction="column" gap={8} align="center" justify="center">
              <Flex direction="row" gap={8} align="center">
                <Text noMargin>{browser.i18n.getMessage("percentage_of_daily_ao_to_sell")}</Text>
                <Tooltip
                  underline
                  content={
                    <Text size="sm" weight="medium" style={{ maxWidth: "180px" }} noMargin>
                      {browser.i18n.getMessage("percentage_of_daily_ao_to_sell_description")}
                    </Text>
                  }
                  position="bottomEnd">
                  <HelpCircle height={16} width={16} color={theme.tertiaryText} />
                </Tooltip>
              </Flex>
              <Text size="4xl" weight="medium" noMargin>
                {percentage}%
              </Text>
            </Flex>
            <Slider value={percentage} onChange={setPercentage} min={0} max={100} minLabel="0" maxLabel="100" />
          </Flex>
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
          <Button style={{ flex: 1 }} disabled={continueButtonDisabled} onClick={handleContinue} fullWidth>
            {browser.i18n.getMessage("continue")}
          </Button>
          <Button
            style={{ maxWidth: "max-content" }}
            variant="secondary"
            icon={<ClockRewind height={24} width={24} />}
            onClick={() => navigate(PopupPaths.AOYieldAgentHistory)}
          />
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
        runIndefinitely={runIndefinitely}
        initialSelection={initialSelection}
      />
      <AODelegationModal />
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
