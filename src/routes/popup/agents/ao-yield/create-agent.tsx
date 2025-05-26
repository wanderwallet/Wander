import styled, { useTheme } from "styled-components";
import { Button, Input, Section, Text, Tooltip } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { Flex } from "~components/common/Flex";
import { ChevronDown, ClockRewind, HelpCircle } from "@untitled-ui/icons-react";
import { useState } from "react";
import { Slider } from "~components/Slider";
import { InputButton } from "~components/common/InputButton";
import { HorizontalLine } from "~components/HorizontalLine";
import { assets, AssetSelectorModal, type Asset } from "../components/ao-yield/AssetSelectorModal";
import { SlippageSelectorModal } from "../components/ao-yield/SlippageSelectorModal";

export function CreateAOYieldAgentView() {
  const theme = useTheme();
  const [percentage, setPercentage] = useState(50);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const [selectedSlippage, setSelectedSlippage] = useState(0.5);
  const [runIndefinitely, setRunIndefinitely] = useState(false);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showSlippageSelector, setShowSlippageSelector] = useState(false);

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

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("agents")} />
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
                <Input placeholder="0" />
                <Text variant="secondary" size="base" weight="semibold" noMargin>
                  -
                </Text>
                <Input placeholder="0" />
              </Flex>
            </Flex>
            <Flex direction="row" gap={8} align="center">
              <input
                type="checkbox"
                height={14}
                width={14}
                checked={runIndefinitely}
                onChange={() => setRunIndefinitely((prev) => !prev)}
              />
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
          <Button style={{ flex: 1 }} fullWidth>
            {browser.i18n.getMessage("continue")}
          </Button>
          <Button
            style={{ maxWidth: "max-content" }}
            variant="secondary"
            icon={<ClockRewind height={24} width={24} />}
          />
        </Flex>
      </Wrapper>
      <AssetSelectorModal open={showAssetSelector} onClose={closeAssetSelector} onSelect={setSelectedAsset} />
      <SlippageSelectorModal
        open={showSlippageSelector}
        onClose={closeSlippageSelector}
        slippage={selectedSlippage}
        onSelect={setSelectedSlippage}
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
