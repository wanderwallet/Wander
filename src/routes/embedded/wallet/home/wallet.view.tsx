import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import { getDecryptionKey } from "~wallets/auth";
import { trackEvent, EventType, trackPage, PageType, checkWalletBits } from "~utils/analytics";
import { useActiveWallet } from "~wallets/hooks";
import { scheduleImportAoTokens } from "~tokens/aoTokens/sync";
import { Card, Divider, AccountSelector, TabBar } from "~components/embed/ui";

import type { StoredWallet } from "~wallets";
import { WalletHomeActions } from "./actions.container";
import { WalletHomeAssets } from "./assets.container";
import { useBalanceSortedTokens } from "~/tokens/hooks";
import { WalletHomeBalance } from "./balance.container";

export function WalletHomeEmbeddedView() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useStorage<number>(
    {
      key: "wallet_home_active_tab",
      instance: ExtensionStorage,
    },
    0,
  );
  const [announcement, _] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage,
  });

  const { tokens, prices } = useBalanceSortedTokens({
    type: "asset",
    hidden: false,
  });

  const wallet = useActiveWallet();
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );
  useEffect(() => {
    const trackEventAndPage = async () => {
      await trackEvent(EventType.LOGIN, {});
      await trackPage(PageType.HOME);
    };
    trackEventAndPage();

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
    (async () => {
      const decryptionKey = await getDecryptionKey();
      if (decryptionKey) {
        setLoggedIn(true);
      }

      if (announcement && wallet?.type === "hardware") {
        setOpen(true);
      } else {
        setOpen(false);
      }
    })();
  }, [wallet, announcement]);

  return (
    <Card size="auto" style={{ padding: "32px" }} hasBackButton={false} closeButtonStyles={{ right: "2rem" }}>
      <AccountSelector wallets={wallets} activeWallet={wallet} />
      <WalletHomeBalance />
      <Divider />
      <TabBar tabs={[{ label: "Assets" }, { label: "Actions" }]} setActiveTab={setActiveTab} activeTab={activeTab} style={{ marginBottom: "var(--spacing-3)" }}/>
      {activeTab === 1 ? <WalletHomeActions /> : <WalletHomeAssets tokens={tokens} prices={prices} />}
    </Card>
  );
}
