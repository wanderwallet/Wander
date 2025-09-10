import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import WalletHeader from "~components/popup/WalletHeader";
import Balance from "~components/popup/home/Balance";
import { KeystoneAnnouncementPopup } from "../../components/popup/home/KeystoneAnnouncementPopup";
import { getDecryptionKey } from "~wallets/auth";
import { trackEvent, EventType, trackPage, PageType, checkWalletBits } from "~utils/analytics";
import styled, { useTheme } from "styled-components";
import { useActiveWallet } from "~wallets/hooks";
import Tabs from "~components/popup/home/Tabs";
import { scheduleImportAoTokens } from "~tokens/aoTokens/sync";
import WalletActions from "~components/popup/home/WalletActions";
import { Text, useToasts } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import CreateWanderAgentCTA from "./agents/components/CreateWanderAgentCTA";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { scheduleSwapExecution } from "~utils/agents/swap";
import { WandAnnouncementPopup } from "~components/popup/home/WandAnnouncementPopup";
import ArNSBanner from "~components/popup/home/ArNSBanner";
import { AnnouncementsCarousel } from "./swap/components/AnnouncementsCarousel";
import { SwapAnnouncementPopup } from "./swap/components/SwapAnnouncementPopup";
import { checkForFinishedSwapToShow } from "./swap/utils/swap.progress";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

export function HomeView() {
  const theme = useTheme();
  const toast = useToasts();
  const { navigate } = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [isWandAnnouncementOpen, setWandAnnouncementOpen] = useState(false);
  const [isSwapAnnouncementOpen, setSwapAnnouncementOpen] = useState(false);
  const [isAnnouncementsCarouselOpen, setAnnouncementsCarouselOpen] = useState(false);

  const [announcement, _] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage,
  });

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  // checking to see if it's a hardware wallet
  const wallet = useActiveWallet();

  async function checkTourTaken() {
    const tourTaken = (await ExtensionStorage.get(`tour_taken`)) ?? true;
    if (!tourTaken) {
      toast.setToast({
        type: "info",
        content: ({ close }) => (
          <Flex gap={4}>
            <Text style={{ color: "#fff" }} weight="medium" noMargin>
              {browser.i18n.getMessage("welcome_to_wander")}!
            </Text>
            <Text
              weight="medium"
              noMargin
              style={{ color: theme.primary, cursor: "pointer" }}
              onClick={() => {
                navigate("/getting-started/1");
                close();
              }}>
              {browser.i18n.getMessage("take_the_tour")}
            </Text>
          </Flex>
        ),
        position: "top",
        duration: 5000,
        showIcon: false,
        showProgress: true,
        progressColor: "linear-gradient(47deg, #5842F8 5.41%, #6B57F9 96%)",
      });
      await ExtensionStorage.set(`tour_taken`, true);
    }
  }

  useEffect(() => {
    const trackEventAndPage = async () => {
      await trackEvent(EventType.LOGIN, {});
      await trackPage(PageType.HOME);
    };
    trackEventAndPage();

    checkTourTaken();

    // schedule import ao tokens
    scheduleImportAoTokens();

    // swap execution
    scheduleSwapExecution();
  }, []);

  useEffect(() => {
    const checkBits = async () => {
      if (!loggedIn) return;

      const bits = await checkWalletBits();
    };

    checkBits();
  }, [loggedIn]);

  useAsyncEffect(async () => {
    // check whether to show announcement
    // reset announcements if setting_notifications is uninitialized
    const decryptionKey = await getDecryptionKey();

    if (decryptionKey) {
      setLoggedIn(true);
    }

    const [wandAnnouncementShown, swapAnnouncementShown, announcementsCarouselShown] = await Promise.all([
      ExtensionStorage.get<boolean>("wander_announcement_shown").then((val) => val ?? false),
      ExtensionStorage.get<boolean>("swap_announcement_shown").then((val) => val ?? false),
      ExtensionStorage.get<boolean>("announcements_carousel_shown").then((val) => val ?? false),
    ]);
    setWandAnnouncementOpen(!wandAnnouncementShown);
    setSwapAnnouncementOpen(!swapAnnouncementShown);
    setAnnouncementsCarouselOpen(!announcementsCarouselShown);

    // WALLET.TYPE JUST FOR KEYSTONE POPUP
    setOpen(announcement && wallet?.type === "hardware");
  }, [wallet, announcement]);

  useAsyncEffect(async () => {
    // Check for finished swaps to show on popup open
    try {
      const completedSwap = await checkForFinishedSwapToShow();
      if (completedSwap) {
        if (completedSwap.status === "completed") {
          navigate(PopupPaths.SwapComplete);
        } else {
          navigate(PopupPaths.SwapFailed);
        }
      }
    } catch (error) {
      console.error("Error checking for finished swaps:", error);
    }
  }, [navigate]);

  return (
    <HomeWrapper>
      {/* <AoBanner activeAddress={activeAddress} /> */}
      {loggedIn && (
        <>
          <KeystoneAnnouncementPopup isOpen={isOpen} setOpen={setOpen} />
          <SwapAnnouncementPopup isOpen={isSwapAnnouncementOpen} setOpen={setSwapAnnouncementOpen} />
          <WandAnnouncementPopup isOpen={isWandAnnouncementOpen} setOpen={setWandAnnouncementOpen} />
          <ArNSBanner activeAddress={activeAddress} />
        </>
      )}
      <WalletHeader />
      <HomeContent>
        <Balance />
        <WalletActions />
        {isAnnouncementsCarouselOpen && <AnnouncementsCarousel />}
        <CreateWanderAgentCTA />
        <Tabs />
      </HomeContent>
    </HomeWrapper>
  );
}

const HomeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 100px;
`;

const HomeContent = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 24px;
  padding-right: 24px;
  gap: 24px;
`;
