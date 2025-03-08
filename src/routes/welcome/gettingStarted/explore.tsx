import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import ExploreImage from "url:/assets/setup/explore_tour.png";

export function GettingStartedExploreView() {
  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_EXPLORE);
  }, []);

  return (
    <Container>
      <Content justifyContent="center" alignItems="center" textAlign="center">
        <Image src={ExploreImage} alt="Explore Image" />
        <Text size="lg" weight="medium" noMargin>
          {browser.i18n.getMessage("getting_started_explore_title")}
        </Text>
      </Content>
    </Container>
  );
}

const Image = styled.img`
  width: 100%;
  max-height: 335.602px;
  flex: 1;
`;
