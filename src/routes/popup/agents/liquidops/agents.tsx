import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { Line } from "~routes/popup/purchase";
import { Agent } from "../components/liquidops/Agent";
import { tokenData } from "liquidops";
import { useGateway } from "./utils/hooks/useGateway";
import { useActiveTokens } from "./utils/hooks/useAvailableTokens";

export function LiquidOpsAgentsView() {
  const availableTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const { data: activeTokens } = useActiveTokens();

  return (
    <>
      <HeadV2 title={"LiquidOps " + browser.i18n.getMessage("agents")} />

      <Wrapper>
        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("active_agents")}
          </Text>

          {activeTokens && activeTokens.map((token) => <AgentItem key={token.ticker} token={token} running />)}
        </Flex>

        <Line />

        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("available_agents")}
          </Text>

          {availableTokens.map((token) => (
            <AgentItem key={token.ticker} token={token} />
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

const AgentItem = ({ token, running = false }: { token: any; running?: boolean }) => {
  const { data: logoUrl } = useGateway(token.icon);

  return (
    <Agent
      key={token.ticker}
      ticker={token.cleanTicker}
      logo={logoUrl || `https://arweave.net/${token.icon}`}
      running={running}
    />
  );
};
