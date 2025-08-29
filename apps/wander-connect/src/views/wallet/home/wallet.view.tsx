import React, { useEffect, useMemo } from "react";
import { WalletHomeActions } from "./actions/actions.container";
import { WalletHomeAssets } from "./assets/assets.container";
import { WalletHomeBalance } from "./balance.container";
import browser from "webextension-polyfill";
import { Button, Card } from "@arconnect/components-rebrand";
import { Divider } from "@untitled-ui/icons-react";
import { useStorage, ExtensionStorage, useBalanceSortedTokens, useActiveWallet, StoredWallet, scheduleImportAoTokens } from "@wanderapp/core";
import { SnackbarVariant, AccountSelector, Snackbar, TabBar } from "@wanderapp/ui";
import { EmbeddedPaths } from "../../../router/dashboard/iframe.routes";
import { useEmbedded } from "../../../utils/embedded.hooks";

export function WalletHomeEmbeddedView() {
  const { walletCount, lastRegisteredWallet, clearLastRegisteredWallet, backupMessage, unpartitionedStateStatus } =
    useEmbedded();

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

  // TODO: Use wallets from `EmbeddedProvider` once the nickname/alias is also there.

  const wallet = useActiveWallet();

  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );

  // Banners:

  const { variant, title, children } = useMemo(() => {
    let variant: SnackbarVariant = unpartitionedStateStatus === "supported" ? "warning" : "error";
    let title: string | undefined = undefined;
    let children: React.ReactNode = undefined;

    if (lastRegisteredWallet) {
      variant = "success";
      title =
        walletCount === 1
          ? `Your account has been created!`
          : `Your wallet has been ${lastRegisteredWallet.source.type === "IMPORTED" ? "imported" : "created"}!`;

      children = (
        <Button variant="primary" size="sm" onClick={clearLastRegisteredWallet}>
          Dismiss
        </Button>
      );
    } else if (backupMessage) {
      title = backupMessage;

      children = (
        <p style={{ display: "flex", gap: "var(--spacing-2)" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              browser.tabs.create({ url: "https://www.wander.app/help/benefits-of-backing-up-your-wander-wallet" })
            }>
            Learn more
          </Button>
          <Button variant="primary" size="sm" href={EmbeddedPaths.AccountBackupWallet}>
            Back up now
          </Button>
        </p>
      );
    }

    return { variant, title, children };
  }, [walletCount, lastRegisteredWallet, clearLastRegisteredWallet, backupMessage, unpartitionedStateStatus]);

  useEffect(() => {
    const trackEventAndPage = async () => {
      await trackEvent(EventType.LOGIN, {});
      await trackPage(PageType.HOME);
    };
    trackEventAndPage();

    scheduleImportAoTokens();
  }, []);

  return (
    <Card hasBackButton={false} withExtraPadding>
      <AccountSelector wallets={wallets} currentWallet={wallet as StoredWallet} />
      <WalletHomeBalance />
      <Divider />
      <Snackbar title={title} variant={variant}>
        {children}
      </Snackbar>
      <TabBar
        tabs={[{ label: "Assets" }, { label: "Actions" }]}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        style={{ marginTop: children ? "var(--spacing-6)" : undefined, marginBottom: "var(--spacing-3)" }}
      />
      {activeTab === 1 ? (
        <WalletHomeActions />
      ) : (
        <WalletHomeAssets activeWalletAddress={wallet?.address} tokens={tokens} prices={prices} />
      )}
    </Card>
  );
}
