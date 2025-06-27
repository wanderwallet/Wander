import { QrCode02 } from "@untitled-ui/icons-react";
import { useMemo } from "react";
import {
  Button,
  WalletIcon,
  SeedIcon,
  KeyIcon,
  Text,
  Snackbar,
  type SnackbarVariant,
  Divider,
} from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { signOut } from "~utils/embedded/embedded.utils";

export function AuthRestoreSharesEmbeddedView() {
  const { wallets, unpartitionedStateStatus } = useEmbedded();
  const hasMultipleWallets = wallets.length > 1;
  const hasRecoverableWallets = wallets.some((wallet) => wallet.canBeRecovered) || true;

  let createFirst = false;
  let snackbarVariant: SnackbarVariant = "warning";
  let title = "Using a new device?";
  let message =
    "This happens when you start using Wander on a new device or browser, or clear your browser data. If you've lost your backup options, you can create a new one instead.";
  let unpartitionedStorageMessage = "";
  let showSupportLinks = false;
  let needsWalletCreationConfirmation = false;

  // TODO: Let them know what type of backup/export they made and where? Let them check all available options?
  const lastRecovery = useMemo(() => {
    let lastRecovery = 0;

    wallets.forEach(({ lastBackedUpAt, lastExportedAt }) => {
      lastRecovery = Math.max(lastRecovery, lastBackedUpAt?.getTime() || 0, lastExportedAt?.getTime() || 0);
    });
  }, []);

  // Keep in mind users could have seen the QR or seedphrase backup but then they might not scan or save it, respectively. Also, users might have exported
  // a keyfile or recovery file, but they might have lost it.

  if (!hasRecoverableWallets) {
    createFirst = true;
    showSupportLinks = true;
    snackbarVariant = "error";
    title = "No backups detected";
    message = hasMultipleWallets
      ? `It looks like your wallets are not recoverable. Unless you backed any of them up, they are lost forever. Create a new wallet instead.`
      : `It looks like your wallet is not recoverable. Unless you backed it up, it's lost forever. Create a new wallet instead.`;
  } else if (unpartitionedStateStatus !== "supported") {
    // TODO: Let them know where they've previously signed in?
    showSupportLinks = true;
    snackbarVariant = "error";
    unpartitionedStorageMessage =
      "If you've previously used Wander on a different site, your might still be able to backup your wallet from it. Please, go back and try to backup your wallet.";
  }

  return (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle="Select a method for restoring your wallet."
      onBackButtonClick={() => signOut(false)}>
      <Snackbar title={title} variant={snackbarVariant}>
        <p>{message}</p>
        {unpartitionedStorageMessage ? <p>{unpartitionedStorageMessage} </p> : null}
      </Snackbar>

      {createFirst ? (
        <>
          <Button variant="outlined" isFullWidth icon={<WalletIcon fontSize={24} />} href="/auth/add-wallet">
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

          <Button variant="outlined" isFullWidth icon={<WalletIcon fontSize={24} />} href="/auth/add-wallet">
            Create new wallet
          </Button>
        </>
      )}
    </OnboardingCard>
  );
}
