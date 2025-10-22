import { Flex } from "~components/common/Flex";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { useMemo, useState } from "react";
import { Carousel } from "~components/Carousel";
import { useTheme } from "styled-components";
import { ArrowNarrowLeft, ArrowNarrowRight, CurrencyDollarCircle } from "@untitled-ui/icons-react";
import { defaultStars, AnimatedStarContainer } from "~components/common/AnimatedStarContainer";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { useLocation } from "~wallets/router/router.utils";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { SwapIcon } from "./SwapIcon";
import { AgentIcon } from "./AgentIcon";
import { useIsSwapGated } from "../utils/swap.hooks";
import { ArioIcon } from "~components/embed";
import { useHasArnsNames, useIsArNSPurchaseGated } from "~lib/arns";
import { useActiveAddress } from "~wallets/hooks";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

const stars = defaultStars.toSpliced(1, 1);

const ANNOUNCEMENTS_CAROUSEL_SHOWN = "announcements_carousel_shown";

interface AgentSlide {
  icon: React.ReactNode;
  title: string;
  href: WanderRoutePath;
  disabled?: boolean;
}

const renderSlide = (slide: AgentSlide, onClose: () => void, navigate: (href: WanderRoutePath) => void) => {
  return (
    <AnimatedStarContainer
      stars={stars}
      onClick={() => !slide.disabled && navigate(slide.href)}
      onClose={onClose}
      showCloseButton
      centerCloseButton>
      <Flex direction="row" align="center" gap={8} cursor={slide.disabled ? "default" : "pointer"}>
        {slide.icon}
        <Text weight="semibold" noMargin>
          {slide.title}
        </Text>
      </Flex>
    </AnimatedStarContainer>
  );
};

const agentData = {
  icon: <AgentIcon />,
  title: `${browser.i18n.getMessage("create_an_agent")}!`,
  href: "/agents",
};

const earnData = {
  icon: <CurrencyDollarCircle />,
  title: browser.i18n.getMessage("earn_wndr_tokens"),
  href: "/earn",
};

const swapData = {
  icon: <SwapIcon />,
  title: browser.i18n.getMessage("token_swaps_available_now"),
  href: "/swap",
};

const arnsData = {
  icon: <ArioIcon style={{ height: 24, width: 24 }} />,
  title: `${browser.i18n.getMessage("get_your_arns_name")}!`,
  href: "/arns",
};

export function AnnouncementsCarousel() {
  const theme = useTheme();
  const [isOpen, setOpen] = useState(true);
  const activeAddress = useActiveAddress();
  const hasArnsNames = useHasArnsNames();
  const isSwapGated = useIsSwapGated();
  const isArNSPurchaseGated = useIsArNSPurchaseGated();
  const { navigate } = useLocation();
  const [isArnsPurchaseStartShown] = useStorage<boolean>({
    key: "arns_purchase_start_shown",
    instance: ExtensionStorage,
  });

  const handleOnClose = () => {
    ExtensionStorage.set(ANNOUNCEMENTS_CAROUSEL_SHOWN, true);
    setOpen(false);
  };

  const carouselData = useMemo(() => {
    // TODO: Remove this when swap is re-enabled
    const items = [earnData];
    // const swapUpdatedData = { ...swapData, disabled: isSwapGated };

    // const items = [swapUpdatedData, agentData, earnData];

    if (!hasArnsNames) {
      const arnsHref = isArNSPurchaseGated
        ? `/quick-settings/wallets/${activeAddress}`
        : isArnsPurchaseStartShown
          ? PopupPaths.ArNSPurchaseNameSearch
          : PopupPaths.ArNSPurchaseStart;

      const arnsUpdatedData = { ...arnsData, href: arnsHref };

      items.push(arnsUpdatedData);
    }

    return items;
  }, [isSwapGated, isArNSPurchaseGated, activeAddress, hasArnsNames, isArnsPurchaseStartShown]);

  if (!isOpen || !carouselData?.length) return null;

  return (
    <Carousel
      slides={carouselData}
      renderSlide={(slide) => renderSlide(slide as AgentSlide, handleOnClose, navigate)}
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
