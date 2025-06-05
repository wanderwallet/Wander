import { Button, Text } from "@arconnect/components-rebrand";
import { useStorage } from "@plasmohq/storage/hook";
import styled, { css, keyframes } from "styled-components";
import { Flex } from "~components/common/Flex";
import { ExtensionStorage } from "~utils/storage";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import { XClose } from "@untitled-ui/icons-react";
import { IconButton } from "~components/common/IconButton";
import browser from "webextension-polyfill";
import WanderAgentExplainerPopup from "./WanderAgentExplainerPopup";
import { useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import StarIcon from "~components/welcome/StarIcon";

export default function CreateWanderAgentCTA() {
  const [open, setOpen] = useState(false);
  const { navigate } = useLocation();

  const [showCreateAgent, setShowCreateAgent] = useStorage(
    {
      key: "show_create_wander_agent_cta",
      instance: ExtensionStorage,
    },
    true,
  );

  const [hasShownAgentExplainerPopup, setHasShownAgentExplainerPopup] = useStorage(
    {
      key: "has_shown_agent_explainer_popup",
      instance: ExtensionStorage,
    },
    false,
  );

  const handleOpen = () => {
    if (!hasShownAgentExplainerPopup) {
      setHasShownAgentExplainerPopup(true);
      setOpen(true);
    } else {
      navigate("/agents");
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseCTA = () => {
    setShowCreateAgent(false);
  };

  if (!showCreateAgent) return null;

  return (
    <AnimatedContainer>
      <Flex direction="column" padding="8px 12px 10px 12px" borderRadius={10} gap={12} overflow="hidden">
        <Flex justify="space-between">
          <Flex align="center" gap={4}>
            <ImageContainer>
              <img src={HedgehogHeadIcon} alt="Hedgehog Head" />
            </ImageContainer>
            <Text weight="medium" noMargin>
              {browser.i18n.getMessage("create_wander_agent")}
            </Text>
          </Flex>
          <IconButton
            icon={<XClose style={{ width: 24, height: 24, cursor: "pointer" }} />}
            onClick={() => handleCloseCTA()}
          />
        </Flex>
        <Button fullWidth onClick={() => handleOpen()} style={{ zIndex: 1 }}>
          {browser.i18n.getMessage("get_started")}
        </Button>
        <StarIcon top={-36} right={9} size={82} opacity={0.3} filter="blur(3px)" shineAnimation={shineAnimation} />
        <StarIcon top={32} left={-8} size={32} opacity={0.4} filter="blur(1.5px)" shineAnimation={shineAnimation} />
        <StarIcon top={24} right={74} size={24} opacity={0.4} filter="blur(1.5px)" shineAnimation={shineAnimation} />
        <StarIcon bottom={8} right={-4} size={32} opacity={0.4} filter="blur(1.5px)" shineAnimation={shineAnimation} />
        <WanderAgentExplainerPopup open={open} close={() => handleClose()} />
      </Flex>
    </AnimatedContainer>
  );
}

const shineAnimation = keyframes`
  0% { transform: scale(1.0); opacity: 0.4; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1.0); opacity: 0.4; }
`;

const borderGradientRotate = keyframes`
  from { --angle: 0deg; }
  to { --angle: 360deg; }
`;

const AnimatedContainer = styled.div`
  position: relative;
  padding: 1.2px;
  border-radius: 12px;

  @property --angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    --angle: 0deg;
    background: conic-gradient(
      from var(--angle),
      #6b57f9 0deg,
      rgba(107, 87, 249, 0.8) 45deg,
      rgba(107, 87, 249, 0.4) 90deg,
      rgba(107, 87, 249, 0.2) 135deg,
      rgba(107, 87, 249, 0.3) 180deg,
      rgba(107, 87, 249, 0.5) 225deg,
      rgba(107, 87, 249, 0.8) 270deg,
      rgba(107, 87, 249, 0.9) 315deg,
      #6b57f9 360deg
    );
    animation: ${borderGradientRotate} 3s linear infinite;
    z-index: 0;
  }

  & > div:first-child {
    position: relative;
    z-index: 1;
    border-radius: 10px;
    background: linear-gradient(180deg, #fff 76.26%, #e3d8f6 100%);
    box-shadow: 0px 2px 3.3px 0px rgba(0, 0, 0, 0.07) inset;

    ${({ theme }) =>
      theme.displayTheme === "dark" &&
      css`
        background: linear-gradient(180deg, #26126f 0%, #111 96.95%);
      `}
  }
`;

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
