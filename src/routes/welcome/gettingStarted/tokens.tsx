import styled from "styled-components";
import { useEffect, useState } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import SendTourImage from "url:/assets/setup/send_tour.png";
import SendTourImage2 from "url:/assets/setup/send_tour_2.png";

export function GettingStartedTokensView() {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [SendTourImage, SendTourImage2];

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
        </CarouselContainer>
        <Text size="lg" weight="medium" noMargin>
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

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
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
  flex: 1;
`;
