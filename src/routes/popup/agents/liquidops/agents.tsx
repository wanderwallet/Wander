import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { Line } from "~routes/popup/purchase";
import { Agent } from "../components/liquidops/Agent";
import { tokenData } from "liquidops";
import { useActiveTokens } from "./utils/hooks/useAvailableTokens";
import { useEffect, useMemo } from "react";
import { trackEvent, EventType, trackPage, PageType } from "~utils/analytics";

export function LiquidOpsAgentsView() {
  const availableTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const { data: activeTokens } = useActiveTokens();
  const inactiveTokens = useMemo(
    () =>
      availableTokens.filter((token1) =>
        activeTokens ? !activeTokens.find((token2) => token2.address === token1.address) : [],
      ),
    [availableTokens, activeTokens],
  );

  useEffect(() => {
    trackPage(PageType.LIQUID_OPS_AGENTS);
  }, []);

  return (
    <>
      <HeadV2 title={"LiquidOps " + browser.i18n.getMessage("agents")} />

      <Wrapper>
        {activeTokens && activeTokens.length > 0 && (
          <>
            <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
              <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
                {browser.i18n.getMessage("active_agents")}
              </Text>

              {activeTokens.map((token) => (
                <Agent key={token.ticker} ticker={token.cleanTicker} running={true} profit={token.profit} />
              ))}
            </Flex>

            <Line />
          </>
        )}

        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
            {browser.i18n.getMessage("available_agents")}
          </Text>

          {inactiveTokens.map((token) => (
            <Agent key={token.ticker} ticker={token.cleanTicker} running={false} />
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
