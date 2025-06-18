import styled from "styled-components";
import { Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import { Flex } from "~components/common/Flex";
import { ClockRewind } from "@untitled-ui/icons-react";
import WanderAgentExplainerPopup from "./components/WanderAgentExplainerPopup";
import { useEffect, useMemo, useState } from "react";
import { ExtensionStorage, TempTransactionStorage } from "~utils/storage";
import { AOYieldAgentListItem } from "./components/AOYieldAgentListItem";
import { LiquidOpsAgentListItem } from "./components/LiquidOpsAgentListItem";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { AOMintingPausedListItem } from "./components/AOMintingPausedListItem";
import { useAOYieldLatestAgent } from "~utils/agents/hooks";
import { PageType, trackPage } from "~utils/analytics";
import { useActiveTokens } from "./liquidops/utils/hooks/useAvailableTokens";
import { HAS_SHOWN_AGENTS_EXPLAINER_POPUP } from "~utils/agents/constants";

export function AgentsView() {
  const { navigate } = useLocation();
  const [open, setOpen] = useState(false);
  const aoAgent = useAOYieldLatestAgent();
  const { data: activeTokens } = useActiveTokens();

  const isAgentAvailable = useMemo(() => activeTokens?.length > 0 || !!aoAgent, [activeTokens, aoAgent]);

  async function checkAndShowAgentExplainerPopup() {
    const hasShownAgentExplainerPopup = await ExtensionStorage.get(HAS_SHOWN_AGENTS_EXPLAINER_POPUP);
    if (!hasShownAgentExplainerPopup) {
      setOpen(true);
      await ExtensionStorage.set(HAS_SHOWN_AGENTS_EXPLAINER_POPUP, true);
    }
  }

  useEffect(() => {
    checkAndShowAgentExplainerPopup();
    TempTransactionStorage.remove("ao-yield-agent");
    trackPage(PageType.AGENTS);
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
          {!isAgentAvailable ? (
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
          <LiquidOpsAgentListItem activeTokens={activeTokens} />
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
