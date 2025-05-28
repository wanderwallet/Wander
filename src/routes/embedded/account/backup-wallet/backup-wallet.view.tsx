import { FolderShield, QrCode02, Wallet03 } from "@untitled-ui/icons-react";
import { Button } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AccountBackupWalletEmbeddedView() {
  const { navigate } = useLocation();

  // TODO: What if the user already has more than 3 backup shares?

  // TODO: Do we download one file for the whole account or a file per wallet?

  // TODO: Show confirmation message once backed up and keep the file in-memory
  // in case the button is clicked again.

  // TODO: Add an option to encrypt with a password

  // TODO: Redirect user to backup confirmation next or show some kind of confirmation or just redirect home?

  return (
    <OnboardingCard
      headerText="Wallet backup"
      subtitle="Select a method to back up your wallet which can be used to sign in on a new device or recover your wallet"
      // TODO: This should be reminder in some cases
      onBackButtonClick={() => navigate("/wallet")}>
      <Button
        variant="outlined"
        isFullWidth
        icon={<FolderShield fontSize={24} />}
        href="/account/backup-wallet/recovery-file">
        Download recovery file
      </Button>

      <Button variant="outlined" isFullWidth icon={<Wallet03 fontSize={24} />} href="/account/backup-wallet/full">
        Export wallet
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<QrCode02 fontSize={24} color="currentColor" />}
        href="/account/backup-wallet/qrcode">
        Generate QR code
      </Button>

      {/*
      <Button
        variant="outlined"
        isFullWidth
        icon={<GDriveIcon fontSize={24} />}
        onClick={() => handleOnClick("GDrive")}
      >
        Backup to Google Drive
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        icon={<AppleIcon fontSize={24} />}
        onClick={() => handleOnClick("Apple")}
      >
        Backup to iCloud
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        icon={<DropboxIcon fontSize={24} />}
        onClick={() => handleOnClick("Dropbox")}
      >
        Backup to Dropbox
      </Button> */}

      <Button
        variant="link"
        isFullWidth
        onClick={(e) => {
          e.preventDefault();
          browser.tabs.create({ url: "https://www.wander.app/help/benefits-of-backing-up-your-wander-wallet" });
        }}>
        Why should I back up my account?
      </Button>
    </OnboardingCard>
  );
}
