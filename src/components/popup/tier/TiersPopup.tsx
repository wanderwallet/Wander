import { Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import { Carousel } from "~components/Carousel";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { TierCard } from "./TierCard";
import { WanderIcon } from "./WanderIcon";
import type { Tier } from "~utils/tier/types";
import stars from "~assets/images/tier/stars.png";
import { StarIcon } from "./StarIcon";
import { carouselData } from "~utils/tier/carousel";
import { GetTokensButton } from "./GetTokensButton";

interface WandCarouselSlide {
  tierName: Tier;
  tierBenefits: string[];
  carouselBg: string;
}

const renderSlide = (slide: WandCarouselSlide) => (
  <SlideContent carouselBg={slide.carouselBg}>
    <StarsBackground />
    <TierCard
      tier={slide.tierName}
      style={{ width: "100%", position: "relative", zIndex: 2 }}
      hideBackground
      hideBorder>
      <Flex direction="column" gap={8} align="center" justify="center">
        <WanderIcon height={30} width={64} tier={slide.tierName} />
        <Text size="xl" weight="semibold" noMargin>
          {slide.tierName}
        </Text>
      </Flex>
    </TierCard>
    <Flex
      direction="column"
      gap={24}
      width="100%"
      padding="16px 16px 24px 16px"
      boxSizing="border-box"
      style={{ position: "relative", zIndex: 2 }}>
      <GetTokensButton tier={slide.tierName} />
      <Flex direction="column" gap={8} width="100%">
        {slide.tierBenefits.map((benefit) => (
          <Flex direction="row" gap={8} align="center">
            <StarIcon tier={slide.tierName} />
            <Text size="sm" weight="semibold" noMargin>
              {benefit}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  </SlideContent>
);

export const TiersPopup = ({ isOpen, setOpen }) => {
  return (
    <SliderMenu
      isOpen={isOpen}
      title="Wander Tiers"
      onClose={() => setOpen(false)}
      height="95vh"
      maxHeight="100vh"
      centerTitle>
      <Carousel
        slides={carouselData}
        renderSlide={renderSlide}
        showDots={true}
        showChevrons={true}
        options={{ loop: false }}
      />
    </SliderMenu>
  );
};

const SlideContent = styled.div<{ carouselBg: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.01);
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  position: relative;
  background: url(${({ carouselBg }) => carouselBg}) no-repeat center center;
  background-size: 100% 100%;
`;

const StarsBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 245px;
  height: 56.322px;
  margin-left: 40px;
  background: url(${stars}) no-repeat center center;
  background-size: 100% 100%;
  flex-shrink: 0;
  pointer-events: none;
  z-index: 1;
  border-radius: 8px;
`;
