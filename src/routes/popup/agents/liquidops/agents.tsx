import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ListItem, Section, Spacer, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../components/SvgImage";
import AoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { Line } from "~routes/popup/purchase";
import { Agent } from "../components/liquidops/Agent";
import { Quantity } from "ao-tokens";

export function LiquidOpsAgentsView() {
  return (
    <>
      <HeadV2 title={"LiquidOps " + browser.i18n.getMessage("agents")} />

      <Wrapper>
        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("active_agents")}
          </Text>

          <Agent ticker="USDA" walletBalance={new Quantity(1244n, 2n)} supplyAPY={3.43} logo={AoLogo} running />
        </Flex>

        <Line />

        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("available_agents")}
          </Text>

          <Agent ticker="AO" walletBalance={new Quantity(1244n, 2n)} supplyAPY={1.13} logo={AoLogo} />
          <Agent ticker="wAR" walletBalance={new Quantity(718n, 2n)} supplyAPY={1.57} logo={AoLogo} />
        </Flex>
      </Wrapper>
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
  padding-bottom: 100px;
`;
