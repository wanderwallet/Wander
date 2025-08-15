import styled, { useTheme } from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import BuyImage from "url:/assets/setup/buy_tour.png";
import BuyImageLight from "url:/assets/setup/buy_tour_light.png";

export function GettingStartedOnrampView() {
  const theme = useTheme();
  const image = theme.displayTheme === "dark" ? BuyImage : BuyImageLight;

  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_ONRAMP);
  }, []);

  return (
    <Container>
      <Content justifyContent="flex-start" alignItems="center" textAlign="center">
        <Image src={image} alt="Placeholder Image" />
        <Text size="md" weight="medium" noMargin>
          {browser.i18n.getMessage("getting_started_onramp_title")}
        </Text>
      </Content>
    </Container>
  );
}

const Image = styled.img`
  width: 100%;
`;
