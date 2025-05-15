import { Button, WalletIcon, SeedIcon, KeyIcon } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { signOut } from "~utils/embedded/embedded.utils";

export function AuthRestoreSharesEmbeddedView() {
  // TODO: Automatically retry loading wallets once before showing this screen?

  return (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle="Select a method for restoring your wallet."
      onBackButtonClick={ () => signOut(false) }>

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
        href="#/auth/restore-shares/recovery-file">
        Import Recovery File
      </Button>

      <Button variant="outlined" isFullWidth icon={<SeedIcon fontSize={24} />} href="#/auth/restore-shares/seedphrase">
        Enter Seedphrase
      </Button>

      <Button variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />} href="#/auth/restore-shares/keyfile">
        Import keyfile
      </Button>
    </OnboardingCard>
  );
}
