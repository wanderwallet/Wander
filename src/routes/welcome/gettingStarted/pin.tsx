import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import PinExtension from "url:/assets/setup/pin-extension.png";

export function GettingStartedPinView() {
  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_PIN_EXTENSION);
  }, []);

  return (
    <Container>
      <Content
        justifyContent="flex-start"
        alignItems="center"
        textAlign="center"
      >
        <Image src={PinExtension} alt="Pin Extension" />
        <Text size="md" weight="medium" noMargin>
          {browser.i18n.getMessage("getting_started_pin_title")}
        </Text>
      </Content>
    </Container>
  );
}

const Image = styled.img`
  width: 100%;
`;
