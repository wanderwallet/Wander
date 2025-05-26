import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import HedgehogHeadIcon from "url:/assets/agents/hedgehog-head.svg";
import { Flex } from "~components/common/Flex";
import { ClockRewind } from "@untitled-ui/icons-react";
import WanderAgentExplainerPopup from "./components/WanderAgentExplainerPopup";
import { useEffect, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { AOYieldAgentListItem } from "./components/AOYieldAgentListItem";
import { LiquidOpsAgentListItem } from "./components/LiquidOpsAgentListItem";

export function AgentsView() {
  const [open, setOpen] = useState(false);

  // TODO: Check if there are available agents
  const aoYieldAgentAvailable = false;

  async function checkAndShowAgentExplainerPopup() {
    const hasShownAgentExplainerPopup = await ExtensionStorage.get("has_shown_agent_explainer_popup");
    if (!hasShownAgentExplainerPopup) {
      setOpen(true);
      await ExtensionStorage.set("has_shown_agent_explainer_popup", true);
    }
  }

  useEffect(() => {
    checkAndShowAgentExplainerPopup();
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("agents")} backIcon={<ClockRewind fontSize={24} />} back={() => {}} />

      <Wrapper>
        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          {!aoYieldAgentAvailable ? (
            <>
              <img src={HedgehogHeadIcon} alt="Hedgehog Head" height={128} width={120} />
              <Text size="md" weight="medium" noMargin>
                {browser.i18n.getMessage("no_active_yield_agents")}
              </Text>
            </>
          ) : (
            <Text style={{ alignSelf: "flex-start" }} weight="semibold" noMargin>
              {browser.i18n.getMessage("your_agents")}
            </Text>
          )}
          <AOYieldAgentListItem aoYieldAgentAvailable={aoYieldAgentAvailable} />
          <LiquidOpsAgentListItem />
        </Flex>
      </Wrapper>
      <WanderAgentExplainerPopup open={open} close={() => setOpen(false)} />
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
