import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Button, KeyIcon, SeedIcon } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { QrCode02 } from "@untitled-ui/icons-react";
import { navigate } from "wouter/use-hash-location";

export function AuthImportWalletEmbeddedView() {
  const { authStatus } = useEmbedded();

  // Loading state:

  const areButtonsDisabled = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  const isViewLoading = areButtonsDisabled;

  return (
    <OnboardingCard
      headerText={authStatus === "noWallets" ? "Import a Wallet" : "Restore Wallet"}
      subtitle="Import an existing Arweave/AO wallet into your Wander Connect account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={isViewLoading}>
      <Button
        variant="outlined"
        isFullWidth
        icon={<SeedIcon fontSize={24} />}
        href="/auth/import-seedphrase"
        isDisabled={areButtonsDisabled}>
        Enter Seedphrase
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<KeyIcon fontSize={24} />}
        href="/auth/import-keyfile"
        isDisabled={areButtonsDisabled}>
        Import Keyfile
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<QrCode02 fontSize={24} color="currentColor" />}
        href="/auth/import-qrcode"
        isDisabled={areButtonsDisabled}>
        Scan QR Code
      </Button>
    </OnboardingCard>
  );
}
