import { QrCode02 } from "@untitled-ui/icons-react";
import { useMemo } from "react";
import { Button, WalletIcon, SeedIcon, KeyIcon, Snackbar, type SnackbarVariant, Divider } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { formatDate } from "~utils/agents/utils";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { signOut } from "~utils/embedded/embedded.utils";
import browser from "webextension-polyfill";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRestoreSharesEmbeddedView() {
  const { back } = useLocation();
  const { currentWallet, wallets, unpartitionedStateStatus } = useEmbedded();
  const hasMultipleWallets = wallets.length > 1;
  const hasCloudBackup = currentWallet.totalCloudBackups > 0;

  // TODO: Let them know what type of backup/export they made and where? Let them check all available options?

  const { lastRecovery, hasRecoverableWallets } = useMemo(() => {
    let lastRecovery = 0;
    let hasRecoverableWallets = false;

    wallets.forEach(({ canBeRecovered, lastBackedUpAt, lastExportedAt, lastCloudBackedUpAt }) => {
      lastRecovery = canBeRecovered
        ? Math.max(
            lastRecovery,
            lastBackedUpAt?.getTime() || 0,
            lastExportedAt?.getTime() || 0,
            lastCloudBackedUpAt?.getTime() || 0,
          )
        : lastRecovery;
      hasRecoverableWallets = hasRecoverableWallets || canBeRecovered;
    });

    return {
      lastRecovery,
      hasRecoverableWallets,
    };
  }, []);

  let createFirst = false;
  let snackbarVariant: SnackbarVariant = "warning";
  let title = "No wallets found on this device";
  let message = "New device or browser? Did you clear your browser data? Select a method for restoring your wallet.";
  let unpartitionedStorageMessage = "";

  // Keep in mind users could have seen the QR or seedphrase backup but then they might not scan or save it, respectively. Also, users might have exported
  // a keyfile or recovery file, but they might have lost it.

  if (!hasRecoverableWallets) {
    createFirst = true;
    snackbarVariant = "error";
    title = "No backups detected";
    message = hasMultipleWallets
      ? `It looks like your wallets are not recoverable. Unless you backed any of them up, they are lost forever.`
      : `It looks like your wallet is not recoverable. Unless you backed it up, it's lost forever.`;

    if (unpartitionedStateStatus !== "supported") {
      // TODO: Let them know where they've previously signed in?
      unpartitionedStorageMessage =
        "If you've previously used Wander on a different site, your might still be able to backup your wallet from it.";
    }
  }

  return (
    <OnboardingCard
      headerText="Restore Wallet"
      subtitle="We need to restore you wallet on this device."
      onBackButtonClick={() => (hasCloudBackup ? back() : signOut(false))}>
      <Snackbar title={title} variant={snackbarVariant}>
        <p>{message}</p>
        {unpartitionedStorageMessage ? <p>{unpartitionedStorageMessage} </p> : null}
        {lastRecovery ? <p>You last backed up your wallet on {formatDate(new Date(lastRecovery), "")}</p> : null}
        <p>
          Need help?{" "}
          <Button
            variant="link"
            onClick={(e) => {
              e.preventDefault();
              browser.tabs.create({ url: "https://www.wander.app/help" });
            }}>
            Learn more
          </Button>
        </p>
      </Snackbar>

      {createFirst ? (
        <>
          <Button
            variant="outlined"
            isFullWidth
            icon={<WalletIcon fontSize={24} />}
            href="/auth/restore-shares/create-confirmation">
            Create new wallet
          </Button>

          <Divider text={"OR"} />
        </>
      ) : null}

      {/* <Button
        variant="outlined"
        isFullWidth
        icon={<GDriveIcon fontSize={24} />}
        onClick={() => alert("Not implemented.")}
      >
        Google Drive
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        icon={<AppleIcon fontSize={24} />}
        onClick={() => alert("Not implemented.")}
      >
        iCloud
      </Button> */}

      {/* <Button
        variant="outlined"
        isFullWidth
        icon={<DropboxIcon fontSize={24} />}
        onClick={() => alert("Not implemented.")}
      >
        Dropbox
      </Button> */}

      <Button
        variant="outlined"
        isFullWidth
        icon={<WalletIcon fontSize={24} />}
        href="/auth/restore-shares/recovery-file">
        Import Recovery File
      </Button>

      <Button variant="outlined" isFullWidth icon={<SeedIcon fontSize={24} />} href="/auth/restore-shares/seedphrase">
        Enter Seedphrase
      </Button>

      <Button variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />} href="/auth/restore-shares/keyfile">
        Import keyfile
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<QrCode02 fontSize={24} color="currentColor" />}
        href="/auth/restore-shares/qrcode">
        Scan QR Code
      </Button>

      {createFirst ? null : (
        <>
          <Divider text={"OR"} />

          <Button
            variant="outlined"
            isFullWidth
            icon={<WalletIcon fontSize={24} />}
            href="/auth/restore-shares/create-confirmation">
            Create new wallet
          </Button>
        </>
      )}
    </OnboardingCard>
  );
}
