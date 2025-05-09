import { FolderShield, Wallet03 } from "@untitled-ui/icons-react";
import { useCallback, useState } from "react";
import { Box, Button, Card, Spacer, WanderFooter } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";

export function AccountBackupWalletEmbeddedView() {
  const [isLoading, setIsLoading] = useState({
    calledId: "",
    status: false,
  });
  const { navigate } = useLocation();

  const handleOnClick = useCallback(async (method: "GDrive" | "Apple" | "Dropbox" | "FullWallet" | "RecoveryFile") => {
    const setLoadingState = (status: boolean) => setIsLoading({ calledId: method, status });

    try {
      setLoadingState(true);

      switch (method) {
        case "RecoveryFile":
          navigate("/account/backup-wallet/recovery-file");
          break;

        case "FullWallet":
          navigate("/account/backup-wallet/full");
          break;

        case "GDrive":
        case "Apple":
        case "Dropbox":
          console.log("Not implemented yet");
          break;

        default:
          console.log("Method doesn't exist");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoadingState(false);
    }
  }, []);

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
      // This should be reminder in some cases
      onBackButtonClick={() => navigate("/wallet")}>

      <Button
        variant="outlined"
        isFullWidth
        icon={<FolderShield fontSize={24} />}
        isLoading={isLoading.calledId === "RecoveryFile" && isLoading.status}
        isDisabled={isLoading.calledId === "RecoveryFile" && isLoading.status}
        onClick={() => handleOnClick("RecoveryFile")}>
        Download recovery file
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<Wallet03 fontSize={24} />}
        isLoading={isLoading.calledId === "FullWallet" && isLoading.status === true}
        onClick={() => handleOnClick("FullWallet")}>
        Export wallet
      </Button>

      {/*
      <Button
        variant="outlined"
        isFullWidth
        icon={<GDriveIcon fontSize={24} />}
        onClick={() => handleOnClick("GDrive")}
        isLoading={
          isLoading.calledId === "GDrive" && isLoading.status === true
        }
      >
        Backup to Google Drive
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        icon={<AppleIcon fontSize={24} />}
        onClick={() => handleOnClick("Apple")}
        isLoading={
          isLoading.calledId === "Apple" && isLoading.status === true
        }
      >
        Backup to iCloud
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        icon={<DropboxIcon fontSize={24} />}
        onClick={() => handleOnClick("Dropbox")}
        isLoading={
          isLoading.calledId === "Dropbox" && isLoading.status === true
        }
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
