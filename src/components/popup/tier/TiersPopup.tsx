import { Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import { Carousel } from "~components/Carousel";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { TierCard } from "./TierCard";
import { WanderIcon } from "./WanderIcon";
import { StarIcon } from "./StarIcon";
import { carouselData, type WandCarouselSlide } from "~utils/tier/carousel";
import { GetTokensButton } from "./GetTokensButton";
import CustomizableStars from "./CustomizableStars";
import { ParseTextWithLinks } from "~components/common/ParseTextWithLinks";

const renderSlide = (slide: WandCarouselSlide) => (
  <SlideContent carouselBg={slide.carouselBg} carouselBgLight={slide.carouselBgLight}>
    <TierCard
      tier={slide.tierName}
      style={{ width: "100%", position: "relative", zIndex: 2 }}
      hideBackground
      hideBorder>
      <CustomizableStars
        tier={slide.tierName}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -65%)", zIndex: 1 }}
      />
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
      {slide.tierTitle && (
        <Text style={{ fontSize: "13px", flexWrap: "nowrap" }} weight="semibold" noMargin>
          {slide.tierTitle}
        </Text>
      )}
      {slide.tierDescription && (
        <Text variant="secondary" style={{ fontSize: "13px", flexWrap: "nowrap" }} weight="semibold" noMargin>
          <ParseTextWithLinks text={slide.tierDescription} />
        </Text>
      )}
      <Flex direction="column" gap={8} width="100%">
        {slide.tierBenefits.map((benefit, index) => (
          <Flex key={index} direction="row" gap={8} align="start">
            <StarIcon tier={slide.tierName} />
            <Text size="sm" weight="medium" noMargin>
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

const SlideContent = styled.div<{ carouselBg: string; carouselBgLight: string }>`
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
  background: url(${({ carouselBg, carouselBgLight, theme }) =>
      theme.displayTheme === "dark" ? carouselBg : carouselBgLight})
    no-repeat center center;
  background-size: 100% 100%;
`;
