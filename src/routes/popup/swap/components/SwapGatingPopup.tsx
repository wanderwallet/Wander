import { Spacer, Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { useActiveTier } from "~utils/tier/hooks";
import { carouselData } from "~utils/tier/carousel";
import { GetTokensButton } from "~components/popup/tier/GetTokensButton";
import { TierCard } from "~components/popup/tier/TierCard";
import { TierProgress } from "~components/popup/tier/TierProgress";
import { WanderIcon } from "~components/popup/tier/WanderIcon";
import { StarIcon } from "~components/popup/tier/StarIcon";
import { TierTypes } from "~utils/tier/constants";
import CustomizableStars from "~components/popup/tier/CustomizableStars";

const slide = carouselData.find((slide) => slide.tierName === TierTypes.Reserve);

const tierBenefits = [
  {
    title: "25% reduction on certain fees",
  },
  {
    title: "Full feature access",
    subtitle: "(some premium functions require a higher tier)",
  },
];

export const SwapGatingPopup = ({ isOpen, setOpen }) => {
  const { data: activeTier } = useActiveTier();

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      paddingHorizontal={0}
      paddingVertical={0}
      closeButtonStyle={{
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1000,
      }}>
      <SliderContent>
        <TierCard
          tier={slide.tierName}
          style={{ width: "100%", position: "relative", zIndex: 2 }}
          hideBackground
          hideBorder>
          <CustomizableStars
            tier={slide.tierName}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -65%)", zIndex: 1 }}
          />
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
          <TierProgress activeTier={activeTier} highlightTierLabel={slide.tierName} />
          <Flex direction="column" gap={8} width="100%">
            {tierBenefits.map((benefit) => (
              <Flex direction="row" gap={8} align="center">
                <StarIcon tier={slide.tierName} />
                <TierBenefitText>
                  {benefit.title} {benefit.subtitle && <span>{benefit.subtitle}</span>}
                </TierBenefitText>
              </Flex>
            ))}
          </Flex>
        </Flex>
        <Spacer y={1} />
        <GetTokensButton tier={slide.tierName} />
      </SliderContent>
    </SliderMenu>
  );
};

const SliderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  border-radius: 8px;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  position: relative;
  background-size: 100% 100%;
  padding: 32px 24px;
  background: ${({ theme }) =>
    theme.displayTheme === "dark"
      ? "linear-gradient(180deg, #1a231d 0%, #111 100%)"
      : "linear-gradient(180deg, #F5F9F6 0%, #FFF 100%)"};
  box-shadow: ${({ theme }) =>
    theme.displayTheme === "dark"
      ? `inset 0 22.862px 26.389px -20.902px rgba(134, 229, 169, 0.6),
         inset 0 3.266px 3.919px -1.96px rgba(255, 255, 255, 0.6),
         inset 0 57.481px 45.985px -31.354px rgba(211, 255, 211, 0.1),
         inset 0 2.613px 11.758px 0 rgba(8, 59, 88, 0.3),
         inset 0 0.653px 13.064px 0 rgba(134, 229, 169, 0.2)`
      : `inset 0 22.862px 26.389px -20.902px rgba(134, 229, 169, 0.3),
         inset 0 3.266px 3.919px -1.96px rgba(255, 255, 255, 0.8),
         inset 0 57.481px 45.985px -31.354px rgba(211, 255, 211, 0.2),
         inset 0 2.613px 11.758px 0 rgba(8, 59, 88, 0.1),
         inset 0 0.653px 13.064px 0 rgba(134, 229, 169, 0.1)`};
  backdrop-filter: blur(32.66px);
`;

const TierBenefitText = styled(Text).attrs({
  size: "sm",
  weight: "semibold",
  noMargin: true,
})`
  span {
    color: ${({ theme }) => theme.secondaryText};
  }
`;
