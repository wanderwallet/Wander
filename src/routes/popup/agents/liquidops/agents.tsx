import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import UsdaLogo from "url:/assets/ecosystem/usda.svg";
import { Line } from "~routes/popup/purchase";
import { Agent } from "../components/liquidops/Agent";
import { Quantity } from "ao-tokens";
import { tokenData } from "liquidops";
import { findGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import { useTokenBalance } from "~tokens/hooks";

export function LiquidOpsAgentsView() {
  const availableTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated); // TODO

  const gateway = {
    host: "arweave.net",
    port: 443,
    protocol: "https",
  }; // TODO: await findGateway({ graphql: true });
  const gatewayUrl = concatGatewayURL(gateway);

  return (
    <>
      <HeadV2 title={"LiquidOps " + browser.i18n.getMessage("agents")} />

      <Wrapper>
        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("active_agents")}
          </Text>

          {activeTokens.map((token) => (
            <Agent ticker={token.cleanTicker} logo={`${gatewayUrl}/${token.icon}`} running />
          ))}
        </Flex>

        <Line />

        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("available_agents")}
          </Text>

          {availableTokens.map((token) => (
            <Agent ticker={token.cleanTicker} logo={`${gatewayUrl}/${token.icon}`} />
          ))}
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
