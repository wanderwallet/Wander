import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import { Flex } from "~components/common/Flex";
import { ClockRewind } from "@untitled-ui/icons-react";
import WanderAgentExplainerPopup from "./components/WanderAgentExplainerPopup";
import { useEffect, useState } from "react";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { AOYieldAgentListItem } from "./components/AOYieldAgentListItem";
import { LiquidOpsAgentListItem } from "./components/LiquidOpsAgentListItem";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { AOMintingPausedListItem } from "./components/AOMintingPausedListItem";
import { useAOYieldLatestAgent } from "~utils/agents/hooks";

export function AgentsView() {
  const { navigate } = useLocation();
  const [activeAddress] = useStorage({ key: "active_address", instance: ExtensionStorage });
  const [open, setOpen] = useState(false);
  const aoAgent = useAOYieldLatestAgent();

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
      <HeadV2
        title={browser.i18n.getMessage("agents")}
        backIcon={<ClockRewind fontSize={24} />}
        back={() => navigate(PopupPaths.AOYieldAgentHistory)}
      />

      <Wrapper>
        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          {!aoAgent ? (
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
          <AOYieldAgentListItem aoAgent={aoAgent} />
          <AOMintingPausedListItem />
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
