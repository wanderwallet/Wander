import { QrCode02 } from "@untitled-ui/icons-react";
import { Button, KeyIcon, RecoverHeaderIcon, SeedIcon } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRecoverAccountEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle="Select a method for logging in on new devices and recovering your account."
      onBackButtonClick={() => navigate(`/auth`)}>
      <Button href="/auth/recover-account/seedphrase" variant="outlined" isFullWidth icon={<SeedIcon fontSize={24} />}>
        Enter Seedphrase
      </Button>

      <Button href="/auth/recover-account/keyfile" variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />}>
        Import Keyfile
      </Button>

      <Button
        href="/auth/recover-account/qrcode"
        variant="outlined"
        isFullWidth
        icon={<QrCode02 fontSize={24} color="currentColor" />}>
        Scan QR Code
      </Button>
    </OnboardingCard>
  );
}
