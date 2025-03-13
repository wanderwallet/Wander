import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import { getDecryptionKey } from "~wallets/auth";
import {
  trackEvent,
  EventType,
  trackPage,
  PageType,
  checkWalletBits
} from "~utils/analytics";
import { useActiveWallet } from "~wallets/hooks";
import { scheduleImportAoTokens } from "~tokens/aoTokens/sync";
import { Card, Divider, AccountSelector, TabBar } from "~components/embed/ui";

import Balance from "~components/popup/home/Balance";
import type { StoredWallet } from "~wallets";
import { WalletHomeActions } from "./actions.container";
import { WalletHomeAssets } from "./assets.container";

export function WalletHomeEmbeddedView() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [announcement, _] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });

  // checking to see if it's a hardware wallet
  const wallet = useActiveWallet();
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );
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
    <Card size="auto" style={{ padding: "32px" }} hasBackButton={false}>
      <AccountSelector wallets={wallets} activeWallet={wallet} />
      <Balance />
      <Divider />

      <TabBar
        tabs={[{ label: "Assets" }, { label: "Actions" }]}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />
      {activeTab === 1 ? <WalletHomeActions /> : <WalletHomeAssets />}
    </Card>
  );
}
