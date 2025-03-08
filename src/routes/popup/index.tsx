import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import WalletHeader from "~components/popup/WalletHeader";
import Balance from "~components/popup/home/Balance";
import { AnnouncementPopup } from "./announcement";
import { getDecryptionKey } from "~wallets/auth";
import {
  trackEvent,
  EventType,
  trackPage,
  PageType,
  checkWalletBits
} from "~utils/analytics";
import styled from "styled-components";
import { useActiveWallet } from "~wallets/hooks";
import Tabs from "~components/popup/home/Tabs";
import { scheduleImportAoTokens } from "~tokens/aoTokens/sync";
import WalletActions from "~components/popup/home/WalletActions";
import { HorizontalLine } from "~components/HorizontalLine";

export function HomeView() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);

  const [announcement, _] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });

  // checking to see if it's a hardware wallet
  const wallet = useActiveWallet();

  useEffect(() => {
    const trackEventAndPage = async () => {
      await trackEvent(EventType.LOGIN, {});
      await trackPage(PageType.HOME);
    };
    trackEventAndPage();

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
        <HorizontalLine />
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
