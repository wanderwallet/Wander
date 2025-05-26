import styled from "styled-components";
import SliderMenu from "~components/SliderMenu";
import { XClose } from "@untitled-ui/icons-react";
import { Button, Text } from "@arconnect/components-rebrand";
import HedgehogPopupImage from "url:/assets/agents/hedgehog-popup.png";
import { Flex } from "~components/common/Flex";
import browser from "webextension-polyfill";

export default function WanderAgentExplainerPopup({ open, close }: Props) {
  if (!open) return null;

  return (
    <SliderMenu hasHeader={false} isOpen={open} onClose={close}>
      <CloseIcon
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
      />
      <Wrapper>
        <img src={HedgehogPopupImage} alt="Hedgehog Popup" style={{ marginBottom: -32 }} />
        <Flex direction="column" gap={8} align="center" textAlign="center">
          <Text size="lg" weight="semibold" noMargin>
            {browser.i18n.getMessage("introducing_the_wander_agent")}
          </Text>
          <Text weight="medium" variant="secondary" noMargin>
            {browser.i18n.getMessage("introducing_the_wander_agent_description")}
          </Text>
        </Flex>
        <Flex direction="column" gap={12} width="100%">
          <Button fullWidth>{browser.i18n.getMessage("create_ao_yield_agent")}</Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              browser.tabs.create({ url: "https://www.wander.app/help#browser-extension" });
            }}>
            {browser.i18n.getMessage("learn_more")}
          </Button>
        </Flex>
      </Wrapper>
    </SliderMenu>
  );
}

const CloseIcon = styled(XClose)`
  cursor: pointer;
  position: absolute;
  top: 0px;
  right: 0px;
  color: ${(props) => props.theme.tertiaryText};
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 32px;
  width: 100%;
`;

interface Props {
  open: boolean;
  close: () => any;
}
