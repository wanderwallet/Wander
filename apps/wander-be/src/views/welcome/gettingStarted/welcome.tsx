import browser from "webextension-polyfill";
import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import WanderIcon from "url:assets/icon.svg";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";

export function GettingStartedWelcomeView() {
  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_WELCOME);
  }, []);

  return (
    <Container>
      <Content justifyContent="center" alignItems="center" textAlign="center">
        <Image src={WanderIcon} alt="Wander Icon" height={64} width={136.5} />
        <Text size="xl" weight="bold" noMargin>
          {browser.i18n.getMessage("welcome_to_wander")}
        </Text>
        <Text variant="secondary" noMargin>
          {browser.i18n.getMessage("welcome_to_wander_description")}
        </Text>
      </Content>
    </Container>
  );
}

const Image = styled.img``;
