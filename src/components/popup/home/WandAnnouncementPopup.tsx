import React, { useEffect } from "react";
import { Button, Text } from "@arconnect/components-rebrand";
import { ExtensionStorage } from "~utils/storage";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Carousel } from "~components/Carousel";
import styled from "styled-components";
import browser from "webextension-polyfill";
import wandAnnouncementBackground from "~assets/images/wand-announcement/wand_announcement_bg.svg";
import { useLocation } from "~wallets/router/router.utils";
import { GetTokensButton } from "../tier/GetTokensButton";
import zeroFeesIcon from "~assets/images/wand-announcement/zero_fees.png";
import exclusiveFeatureIcon from "~assets/images/wand-announcement/exclusive_features.png";
import powerupsIcon from "~assets/images/wand-announcement/powerups.png";
import Lottie from "react-lottie";
import wandTokenAnimationData from "assets/lotties/wander-token-announcement.json";
import wandTokenBgLoop from "assets/lotties/wander-token-bg-loop.json";

interface WandCarouselSlide {
  image: React.ReactNode;
  title: string;
}

const carouselData: WandCarouselSlide[] = [
  {
    image: React.createElement(Lottie as any, {
      options: {
        loop: false,
        autoplay: true,
        animationData: wandTokenAnimationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice",
        },
      },
      height: "100%",
      width: "100%",
    }),
    title: browser.i18n.getMessage("swipe_to_learn_more"),
  },
  {
    image: <img src={zeroFeesIcon} height={148} width={148} alt="zero fees" />,
    title: browser.i18n.getMessage("zero_fees"),
  },
  {
    image: <img src={exclusiveFeatureIcon} height={148} width={148} alt="exclusive feature" />,
    title: browser.i18n.getMessage("exclusive_feature_access"),
  },
  {
    image: <img src={powerupsIcon} height={148} width={148} alt="powerups" />,
    title: browser.i18n.getMessage("power_ups_with_partners"),
  },
];

export const WandAnnouncementPopup = ({ isOpen, setOpen }) => {
  const { navigate } = useLocation();
  const [showFirstSlideContent, setShowFirstSlideContent] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowFirstSlideContent(false);
      const timer = setTimeout(() => {
        setShowFirstSlideContent(true);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("wander_announcement_shown", true);
  }

  const renderSlide = (slide: WandCarouselSlide, index: number) => (
    <SlideContent>
      <Flex direction="column" gap={8} align="center" justify="center">
        {(index !== 0 || showFirstSlideContent) && (
          <BackgroundAnimation>
            {React.createElement(Lottie as any, {
              options: {
                loop: true,
                autoplay: true,
                animationData: wandTokenBgLoop,
                rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
              },
              height: "100%",
              width: "100%",
            })}
          </BackgroundAnimation>
        )}
        <SlideContentOverlay>
          <ImageContainer>{slide.image}</ImageContainer>
        </SlideContentOverlay>
      </Flex>
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
        <Flex direction="column" width="100%" height="100%">
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
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
`;

const BackgroundAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const SlideContentOverlay = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 320px;
  gap: 24px;
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
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
