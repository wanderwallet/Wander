import { Button, Text } from "@arconnect/components-rebrand";
import { ExtensionStorage } from "~utils/storage";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Carousel } from "~components/Carousel";
import styled from "styled-components";
import browser from "webextension-polyfill";
import powerups from "~assets/images/wand-announcement/powerups.svg";
import exclusiveFeature from "~assets/images/wand-announcement/exclusive_feature.svg";
import zeroFees from "~assets/images/wand-announcement/zero_fees.svg";
import wand from "~assets/images/wand-announcement/wand.svg";
import wandAnnouncementBackground from "~assets/images/wand-announcement/wand_announcement_bg.svg";
import { useLocation } from "~wallets/router/router.utils";
import { GetTokensButton } from "../tier/GetTokensButton";

interface WandCarouselSlide {
  image: string;
  title: string;
}

const carouselData: WandCarouselSlide[] = [
  {
    image: wand,
    title: browser.i18n.getMessage("swipe_to_learn_more"),
  },
  {
    image: zeroFees,
    title: browser.i18n.getMessage("zero_fees"),
  },
  {
    image: exclusiveFeature,
    title: browser.i18n.getMessage("exclusive_feature_access"),
  },
  {
    image: powerups,
    title: browser.i18n.getMessage("power_ups_with_partners"),
  },
];

export const WandAnnouncementPopup = ({ isOpen, setOpen }) => {
  const { navigate } = useLocation();

  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("wander_announcement_shown", true);
  }

  const renderSlide = (slide: WandCarouselSlide) => (
    <SlideContent>
      <CarouselImage src={slide.image} alt={slide.title} />
      <Text weight="semibold" style={{ color: "white" }} noMargin>
        {slide.title}
      </Text>
    </SlideContent>
  );

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={handleClose}
      style={{
        backgroundImage: `url(${wandAnnouncementBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "24px",
        boxSizing: "border-box",
      }}
      closeIconColor="white"
      fullscreen>
      <Flex direction="column" justify="space-between" height="100%">
        <Flex direction="column" width="100%">
          <Flex direction="column" gap={8} align="center" justify="center">
            <WhiteText size="sm" weight="semibold" noMargin>
              {browser.i18n.getMessage("introducing_the")}
            </WhiteText>
            <Flex gap={4} justify="center" align="flex-end">
              <Text
                size="3xl"
                weight="semibold"
                style={{
                  background: "linear-gradient(89deg, #7461FA -3.24%, #8B7AFD 98.77%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                noMargin>
                $WNDR
              </Text>
              <WhiteText style={{ marginLeft: 4 }} size="3xl" weight="semibold" noMargin>
                {browser.i18n.getMessage("token")}!
              </WhiteText>
            </Flex>
          </Flex>

          <Carousel
            slides={carouselData}
            renderSlide={renderSlide}
            showDots={true}
            dotColor="rgba(255, 255, 255, 0.4)"
            activeDotColor="white"
          />
        </Flex>

        <Flex direction="column" width="100%">
          <GetTokensButton variant="normal" />
          <LinkButton fullWidth onClick={() => navigate("/tier")}>
            {browser.i18n.getMessage("explore_tier_benefits")}
          </LinkButton>
        </Flex>
      </Flex>
    </SliderMenu>
  );
};

const SlideContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const CarouselImage = styled.img`
  width: 100%;
  height: 100%;
`;

const LinkButton = styled(Button)`
  background: none;
  border: none;
  transition: all 0.2s ease;
  &:hover {
    background: none;
    opacity: 0.8;
  }
`;

const WhiteText = styled(Text)`
  color: white;
`;
