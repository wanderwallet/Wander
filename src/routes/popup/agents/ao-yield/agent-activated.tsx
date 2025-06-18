import styled from "styled-components";
import { Button, Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import agentActivated from "url:/assets/agents/images/agent-activated.svg";
import agentNotActivated from "url:/assets/agents/images/agent-not-activated.svg";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";

export function AOYieldAgentActivatedView() {
  const { navigate, back } = useLocation();
  const { activationStatus = "success" } = useSearchParams<{ activationStatus: "success" | "error" }>();
  const isActivated = activationStatus === "success";

  const handlePrimaryAction = () => {
    if (isActivated) {
      navigate(PopupPaths.Home);
    } else {
      // double back to get to the create agent page
      back();
      back();
    }
  };

  const handleSecondaryAction = () => {
    if (isActivated) {
      navigate(PopupPaths.ManageAOYieldAgent);
    } else {
      navigate(PopupPaths.Home);
    }
  };

  useEffect(() => {
    if (!activationStatus) return;

    if (isActivated) {
      trackPage(PageType.AO_YIELD_AGENT_ACTIVATED);
    } else {
      trackPage(PageType.AO_YIELD_AGENT_ACTIVATION_FAILED);
    }
  }, [isActivated, activationStatus]);

  return (
    <Wrapper>
      <Content>
        <Flex direction="column" align="center" justify="center" gap={16} style={{ paddingTop: "100px" }}>
          <img style={{ flexShrink: 0 }} src={isActivated ? agentActivated : agentNotActivated} alt="confirm agent" />
          <Flex direction="column" justify="center" align="center" textAlign="center" gap={8}>
            <Text weight="bold" style={{ fontSize: 22 }} noMargin>
              {browser.i18n.getMessage(isActivated ? "agent_activated_title" : "agent_not_activated_title")}
            </Text>
            <Text variant="secondary" weight="medium" noMargin>
              {browser.i18n.getMessage(isActivated ? "agent_activated_description" : "agent_not_activated_description")}
            </Text>
          </Flex>
        </Flex>
      </Content>
      <Flex direction="column" gap={12}>
        <Button onClick={handlePrimaryAction} fullWidth>
          {browser.i18n.getMessage(isActivated ? "go_to_dashboard" : "try_again")}
        </Button>
        <Button onClick={handleSecondaryAction} variant="secondary" fullWidth>
          {browser.i18n.getMessage(isActivated ? "manage_agent" : "go_to_dashboard")}
        </Button>
      </Flex>
    </Wrapper>
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
  height: calc(100vh - 24px);
  background-color: ${({ theme }) => theme.background};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  height: 100%;
  gap: 16px;
`;
