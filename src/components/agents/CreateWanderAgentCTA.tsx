import { Button, Text } from "@arconnect/components-rebrand";
import { useStorage } from "@plasmohq/storage/hook";
import styled, { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import { ExtensionStorage } from "~utils/storage";
import HedgehogHeadIcon from "url:/assets/agents/hedgehog-head.svg";
import { XClose } from "@untitled-ui/icons-react";
import { IconButton } from "~components/common/IconButton";
import browser from "webextension-polyfill";

export default function CreateWanderAgentCTA() {
  const theme = useTheme();

  const [showCreateAgent, setShowCreateAgent] = useStorage(
    {
      key: "show_create_wander_agent_cta",
      instance: ExtensionStorage,
    },
    true,
  );

  const handleClose = () => {
    setShowCreateAgent(false);
  };

  if (!showCreateAgent) return null;

  return (
    <Flex
      direction="column"
      padding="8px 12px 10px 12px"
      background={theme.surfaceSecondary}
      borderRadius={10}
      gap={12}>
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
          onClick={() => handleClose()}
        />
      </Flex>
      <Button fullWidth>{browser.i18n.getMessage("get_started")}</Button>
    </Flex>
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
