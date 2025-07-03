import { Spacer, Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import styled from "styled-components";
import { TierButton } from "./TierButton";
import { Flex } from "~components/common/Flex";
import { TierCard } from "./TierCard";
import { WanderIcon } from "./WanderIcon";
import stars from "~assets/images/tier/stars.png";
import { useActiveTier } from "~utils/tier/hooks";
import { TierProgress } from "./TierProgress";
import { StarIcon } from "./StarIcon";
import browser from "webextension-polyfill";
import { carouselData } from "~utils/tier/carousel";

export const TierProgressPopup = ({ isOpen, setOpen }) => {
  const { data: activeTier } = useActiveTier();
  const slide = carouselData.find((slide) => slide.tierName === activeTier?.tier);

  if (!slide) return null;

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      paddingHorizontal={0}
      paddingVertical={0}
      hasHeader={false}>
      <SliderContent carouselBg={slide.carouselBg}>
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
        <Text size="md" weight="semibold" noMargin style={{ padding: "16px 0" }}>
          Unlock {slide.tierName} to use this feature
        </Text>
        <Flex direction="column" gap={32} width="100%" boxSizing="border-box" style={{ marginTop: 16 }}>
          <TierProgress activeTier={activeTier} />
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
        <Spacer y={1} />
        <TierButton
          tier={slide.tierName}
          onClick={() => browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" })}>
          Get WNDR tokens
        </TierButton>
      </SliderContent>
    </SliderMenu>
  );
};

const SliderContent = styled.div<{ carouselBg: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.01);
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  position: relative;
  background: url(${({ carouselBg }) => carouselBg}) no-repeat center center;
  background-size: 100% 100%;
  padding: 32px 24px;
`;

const StarsBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 245px;
  height: 56.322px;
  margin-left: 60px;
  margin-top: 40px;
  background: url(${stars}) no-repeat center center;
  background-size: 100% 100%;
  flex-shrink: 0;
  pointer-events: none;
  z-index: 1;
  border-radius: 8px;
`;
