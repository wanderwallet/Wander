import styled, { useTheme } from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import SendTourImage from "url:/assets/setup/send_tour.png";
import SendTourImageLight from "url:/assets/setup/send_tour_light.png";

export function GettingStartedTokensView() {
  const theme = useTheme();

  const image = theme.displayTheme === "dark" ? SendTourImage : SendTourImageLight;

  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_TOKENS);
  }, []);

  return (
    <Container>
      <Content justifyContent="flex-start" alignItems="center" textAlign="center">
        <Image src={image} alt="Send Tour" />
        <Text size="md" weight="medium" noMargin>
          {browser.i18n.getMessage("getting_started_tokens_title")}
        </Text>
      </Content>
    </Container>
  );
}

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
`;

const Image = styled.img`
  width: 100%;
`;
