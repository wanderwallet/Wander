import styled, { useTheme } from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import SendTourImage from "url:/assets/setup/send_tour.png";
import SendTourImage2 from "url:/assets/setup/send_tour_2.png";
import SendTourImageLight from "url:/assets/setup/send_tour_light.png";

export function GettingStartedTokensView() {
  const theme = useTheme();
  const [currentImage, setCurrentImage] = useState(0);

  const images =
    theme.displayTheme === "dark"
      ? [SendTourImage, SendTourImage2]
      : [SendTourImageLight, SendTourImage2];

  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_TOKENS);
  }, []);

  return (
    <Container>
      <Content justifyContent="center" alignItems="center" textAlign="center">
        <CarouselContainer>
          <Image src={images[currentImage]} alt="Send Tour" />
          <DotsContainer>
            {images.map((_, index) => (
              <Dot
                key={index}
                active={currentImage === index}
                onClick={() => setCurrentImage(index)}
              />
            ))}
          </DotsContainer>
          <Text size="md" weight="medium" noMargin>
            {browser.i18n.getMessage("getting_started_tokens_title")}
          </Text>
        </CarouselContainer>
      </Content>
    </Container>
  );
}

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
`;

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  margin-bottom: 12px;
`;

const Dot = styled.button<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: ${({ active }) => (active ? "#6B57F9" : "#66666680")};
  cursor: pointer;
  padding: 0;
  transition: background 0.3s ease;
`;

const Image = styled.img`
  width: 100%;
`;
