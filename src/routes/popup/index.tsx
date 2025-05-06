import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import WalletHeader from "~components/popup/WalletHeader";
import Balance from "~components/popup/home/Balance";
import { AnnouncementPopup } from "./announcement";
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

export function HomeView() {
  const theme = useTheme();
  const toast = useToasts();
  const { navigate } = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);

  const [announcement, _] = useStorage<boolean>({
    key: "show_announcement",
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
  }, []);

  useEffect(() => {
    const checkBits = async () => {
      if (!loggedIn) return;

      const bits = await checkWalletBits();
    };

    checkBits();
  }, [loggedIn]);

  useEffect(() => {
    // check whether to show announcement
    (async () => {
      // reset announcements if setting_notifications is uninitialized
      const decryptionKey = await getDecryptionKey();
      if (decryptionKey) {
        setLoggedIn(true);
      }

      // WALLET.TYPE JUST FOR KEYSTONE POPUP
      if (announcement && wallet?.type === "hardware") {
        setOpen(true);
      } else {
        setOpen(false);
      }
    })();
  }, [wallet, announcement]);

  return (
    <HomeWrapper>
      {/* <AoBanner activeAddress={activeAddress} /> */}
      {loggedIn && <AnnouncementPopup isOpen={isOpen} setOpen={setOpen} />}
      <WalletHeader />
      <HomeContent>
        <Balance />
        <WalletActions />
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
