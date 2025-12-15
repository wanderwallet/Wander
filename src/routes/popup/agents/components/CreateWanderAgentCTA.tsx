import { Button, Text } from "@wanderapp/components";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { ExtensionStorage } from "~utils/storage";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import browser from "webextension-polyfill";
import WanderAgentExplainerPopup from "./WanderAgentExplainerPopup";
import { useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { EventType, trackEvent } from "~utils/analytics";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { HAS_SHOWN_AGENTS_EXPLAINER_POPUP, SHOW_CREATE_WANDER_AGENT_CTA } from "~utils/agents/constants";
import { AnimatedStarContainer } from "~components/common/AnimatedStarContainer";

export default function CreateWanderAgentCTA() {
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [open, setOpen] = useState(false);
  const { navigate } = useLocation();

  const handleOpen = async () => {
    trackEvent(EventType.AGENT_DASHBOARD, {});

    const hasShownAgentExplainerPopup = await ExtensionStorage.get<boolean>(HAS_SHOWN_AGENTS_EXPLAINER_POPUP);

    if (!hasShownAgentExplainerPopup) {
      await ExtensionStorage.set(HAS_SHOWN_AGENTS_EXPLAINER_POPUP, true);
      setOpen(true);
    } else {
      navigate("/agents");
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseCTA = () => {
    ExtensionStorage.set(SHOW_CREATE_WANDER_AGENT_CTA, false);
    setShowCreateAgent(false);
  };

  useAsyncEffect(async () => {
    const storedValue = await ExtensionStorage.get<boolean>(SHOW_CREATE_WANDER_AGENT_CTA);
    setShowCreateAgent(storedValue ?? true);
  }, []);

  if (!showCreateAgent) return null;

  return (
    <AnimatedStarContainer onClose={handleCloseCTA} showCloseButton>
      <Flex direction="column" gap={12}>
        <Flex align="center" gap={4}>
          <ImageContainer>
            <img src={HedgehogHeadIcon} alt="Hedgehog Head" />
          </ImageContainer>
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("create_an_agent")}
          </Text>
        </Flex>
        <Button fullWidth onClick={() => handleOpen()} style={{ zIndex: 1 }}>
          {browser.i18n.getMessage("get_started")}
        </Button>
      </Flex>
      <WanderAgentExplainerPopup open={open} close={() => handleClose()} />
    </AnimatedStarContainer>
  );
}

const ImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 4px;
  box-sizing: border-box;
`;
