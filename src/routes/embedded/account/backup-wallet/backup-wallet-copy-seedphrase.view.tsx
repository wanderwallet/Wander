import { useState, useEffect } from "react";
import { Button, Snackbar, WarningIcon } from "~components/embed/ui";
import { SecretInput } from "~components/embed/ui/atoms/secret-input/SecretInput";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupCopySeedphraseEmbeddedView() {
  const { navigate } = useLocation();
  const { getSeedphrase } = useEmbedded();
  const [seedphrase, setSeedphrase] = useState("");

  async function fetchSeedphrase() {
    const recoveryPhrase = await getSeedphrase(() => Promise.resolve(true));
    if (recoveryPhrase) {
      setSeedphrase(recoveryPhrase);
    }
  }

  useEffect(() => {
    fetchSeedphrase();
  }, []);

  // TODO: Add a cancel button to go straight to backup reminder or wallet dashboard

  return (
    <OnboardingCard
      headerText="Copy seedphrase"
      subtitle="Save your 12 word seedphrase to a password manager, or write it down."
      onBackButtonClick={() => navigate("/account/backup-wallet/full")}>

      <Snackbar
        isFullWidth
        icon={<WarningIcon />}
        text="Do not share this with anyone."
        backgroundColor="#FFF9EA"
        borderColor="#F2DC1320"
        textColor="#121212"
        iconColor="#BD8802"
      />

      <SecretInput
        secret={ seedphrase }
        isLoading={ !seedphrase } />

      <Button isFullWidth onClick={() => navigate("/wallet")}>
        Done
      </Button>
    </OnboardingCard>
  );
}
