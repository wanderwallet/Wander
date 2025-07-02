import { Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import { Carousel } from "~components/Carousel";
import styled from "styled-components";
import { TierButton } from "./TierButton";
import { Flex } from "~components/common/Flex";
import { TierCard } from "./TierCard";
import { WanderIcon } from "./WanderIcon";
import type { Tier } from "~utils/tier/types";
import coreCarouselBg from "~assets/images/tier/core_carousel_bg.png";
import selectCarouselBg from "~assets/images/tier/select_carousel_bg.png";
import plusCarouselBg from "~assets/images/tier/plus_carousel_bg.png";
import primeCarouselBg from "~assets/images/tier/prime_carousel_bg.png";
import eliteCarouselBg from "~assets/images/tier/elite_carousel_bg.png";
import stars from "~assets/images/tier/stars.png";

interface WandCarouselSlide {
  tierName: Tier;
  tierBenefits: string[];
  carouselBg: string;
}

const carouselData: WandCarouselSlide[] = [
  {
    tierName: "Core",
    tierBenefits: ["No benefits"],
    carouselBg: coreCarouselBg,
  },
  {
    tierName: "Select",
    tierBenefits: [
      "5% fee reduction on defi transactions",
      "0% fee reduction on Transak purchases",
      "Select will not have access to all features.  Certain features will be token gated",
    ],
    carouselBg: selectCarouselBg,
  },
  {
    tierName: "Plus",
    tierBenefits: [
      "25% fee reduction on defi transactions",
      "0% fee reduction on Transak purchases",
      "Plus will have access to all standard features but certain premium features will be token gated",
    ],
    carouselBg: plusCarouselBg,
  },
  {
    tierName: "Prime",
    tierBenefits: [
      "75% fee reduction on defi transactions",
      "100% fee reduction on Transak purchases",
      "Access to all features",
      "Early access to new features",
      "Dedicated support channel of their choice: Discord, Slack, Telegram, or Email",
    ],
    carouselBg: primeCarouselBg,
  },
  {
    tierName: "Elite",
    tierBenefits: [
      "100% fee reduction on defi transactions",
      "100% fee reduction on Transak purchases",
      "Access to all features",
      "Early access to new features",
      "Dedicated support channel of their choice: Discord, Slack, Telegram, Email, or schedule a video call with the team",
    ],
    carouselBg: eliteCarouselBg,
  },
];

const renderSlide = (slide: WandCarouselSlide) => (
  <SlideContent carouselBg={slide.carouselBg}>
    <StarsBackground />
    <TierCard
      tier={slide.tierName}
      style={{ width: "100%", position: "relative", zIndex: 2 }}
      hideBackground
      hideBorder>
      <Flex direction="column" gap={4} align="center" justify="center">
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
      <TierButton tier={slide.tierName}>Get WAND tokens</TierButton>
      <Flex direction="column" gap={8} width="100%">
        {slide.tierBenefits.map((benefit) => (
          <Flex direction="row" gap={8} align="center">
            <StarIcon />
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
        dotColor="rgba(255, 255, 255, 0.4)"
        activeDotColor="white"
        showChevrons={true}
      />
    </SliderMenu>
  );
};

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="14"
    viewBox="0 0 15 14"
    fill="none"
    style={{ flexShrink: 0 }}>
    <path
      d="M7.18056 0L8.64585 5.52003L14.1111 7L8.64585 8.47997L7.18056 14L5.71526 8.47997L0.25 7L5.71526 5.52003L7.18056 0Z"
      fill="#D3C8FC"
    />
  </svg>
);

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
