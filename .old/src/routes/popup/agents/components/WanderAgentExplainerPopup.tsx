import styled from "styled-components";
import SliderMenu from "~components/SliderMenu";
import { XClose } from "@untitled-ui/icons-react";
import { Button, Text } from "@arconnect/components-rebrand";
import HedgehogPopupImage from "url:/assets/agents/images/hedgehog-popup.svg";
import { Flex } from "~components/common/Flex";
import browser from "webextension-polyfill";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

export default function WanderAgentExplainerPopup({ open, close }: Props) {
  const { navigate } = useLocation();

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
            {browser.i18n.getMessage(`introducing_the_agents`)}
          </Text>
          <Text weight="medium" variant="secondary" noMargin>
            {browser.i18n.getMessage(`introducing_the_agents_description`)}
          </Text>
        </Flex>
        <Flex direction="column" gap={12} width="100%">
          <Button
            onClick={() => {
              close();
              navigate(PopupPaths.Agents);
            }}
            fullWidth>
            {browser.i18n.getMessage("create_an_agent")}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              browser.tabs.create({ url: "http://www.wander.app/help/browser-extension---how-to-use-agents" });
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
