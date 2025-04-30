import styled, { useTheme } from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import ExploreImage from "url:/assets/setup/explore_tour.png";
import ExploreImageLight from "url:/assets/setup/explore_tour_light.png";

export function GettingStartedExploreView() {
  const theme = useTheme();
  const image =
    theme.displayTheme === "dark" ? ExploreImage : ExploreImageLight;

  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_EXPLORE);
  }, []);

  return (
    <Container>
      <Content
        justifyContent="flex-start"
        alignItems="center"
        textAlign="center"
      >
        <Image src={image} alt="Explore Image" />
        <Text size="md" weight="medium" noMargin>
          {browser.i18n.getMessage("getting_started_explore_title")}
        </Text>
      </Content>
    </Container>
  );
}

const Image = styled.img`
  width: 100%;
  max-height: 335.602px;
`;
