import { Flex } from "~components/common/Flex";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { useState } from "react";
import { Carousel } from "~components/Carousel";
import { useTheme } from "styled-components";
import { ArrowNarrowLeft, ArrowNarrowRight, CurrencyDollarCircle } from "@untitled-ui/icons-react";
import { defaultStars, AnimatedStarContainer } from "~components/common/AnimatedStarContainer";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import { useLocation } from "~wallets/router/router.utils";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { SwapIcon } from "./SwapIcon";

const stars = defaultStars.toSpliced(1, 1);

const ANNOUNCEMENTS_NOTICE_SHOWN = "announcements_notice_shown";

interface AgentSlide {
  icon: React.ReactNode;
  title: string;
  href: WanderRoutePath;
}

const renderSlide = (slide: AgentSlide, onClose: () => void) => {
  const { navigate } = useLocation();

  return (
    <AnimatedStarContainer
      stars={stars}
      onClick={() => navigate(slide.href)}
      onClose={onClose}
      showCloseButton
      centerCloseButton>
      <Flex direction="row" align="center" gap={8}>
        {slide.icon}
        <Text weight="semibold" noMargin>
          {slide.title}
        </Text>
      </Flex>
    </AnimatedStarContainer>
  );
};

const carouselData = [
  {
    icon: <SwapIcon />,
    title: browser.i18n.getMessage("token_swaps_available_now"),
    href: "/swap",
  },
  {
    icon: <SwapIcon />,
    title: `${browser.i18n.getMessage("create_an_agent")}!`,
    href: "/agents",
  },
  {
    icon: <CurrencyDollarCircle />,
    title: browser.i18n.getMessage("earn_wndr_tokens"),
    href: "/earn",
  },
];

export function AnnouncementsCarousel() {
  const theme = useTheme();
  const [isOpen, setOpen] = useState(false);

  const handleOnClose = () => {
    ExtensionStorage.set(ANNOUNCEMENTS_NOTICE_SHOWN, true);
    setOpen(false);
  };

  useAsyncEffect(async () => {
    const storedValue = await ExtensionStorage.get<boolean>(ANNOUNCEMENTS_NOTICE_SHOWN);
    setOpen(!(storedValue ?? false));
  }, []);

  if (!isOpen) return null;

  return (
    <Carousel
      slides={carouselData}
      renderSlide={(slide) => renderSlide(slide as AgentSlide, handleOnClose)}
      showDots={true}
      showNavigationArrows={true}
      slideNavigationGap={8}
      navigationArrowSize={16}
      navigationLeftArrowIcon={ArrowNarrowLeft}
      navigationRightArrowIcon={ArrowNarrowRight}
      dotColor="rgba(102, 102, 102, 0.50)"
      activeDotColor={theme.primary}
      navigationArrowColor={theme.tertiaryText}
      showSlideEdges={true}
    />
  );
}
