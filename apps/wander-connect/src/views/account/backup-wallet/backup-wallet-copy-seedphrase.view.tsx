import { useState } from "react";
import { Button, Snackbar, SecretInput, OnboardingCard } from "@wanderapp/ui";
import { useAsyncEffect, useLocation } from "@wanderapp/core";
import { EmbeddedPaths } from "../../../router/dashboard/iframe.routes";
import { useEmbedded } from "../../../utils/embedded.hooks";

export function AccountBackupCopySeedphraseEmbeddedView() {
  const { navigate } = useLocation();
  const { getSeedphrase } = useEmbedded();
  const [seedphrase, setSeedphrase] = useState("");

  useAsyncEffect(async () => {
    const recoveryPhrase = await getSeedphrase(() => Promise.resolve(true));

    if (recoveryPhrase) {
      setSeedphrase(recoveryPhrase);
    }
  }, []);

  // TODO: Add a cancel button to go straight to backup reminder or wallet dashboard

  return (
    <OnboardingCard
      headerText="Copy seedphrase"
      subtitle="Save your 12 word seedphrase to a password manager, or write it down."
      onBackButtonClick={() => navigate("/account/backup-wallet/full")}>
      <Snackbar variant="warning">Do not share this with anyone.</Snackbar>

      <SecretInput secret={seedphrase} isLoading={!seedphrase} />

      <Button isFullWidth onClick={() => navigate(EmbeddedPaths.WalletHomeEmbeddedView)}>
        Done
      </Button>
    </OnboardingCard>
  );
}
