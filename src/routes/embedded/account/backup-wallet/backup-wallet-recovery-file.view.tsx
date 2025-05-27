import { XClose } from "@untitled-ui/icons-react";
import copy from "copy-to-clipboard";
import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Flex } from "~components/common/Flex";
import { Button, Copyable, Snackbar } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupWalletRecoveryFileEmbeddedView() {
  const { navigate } = useLocation();
  const { currentWallet, generateRecoveryAndDownload } = useEmbedded();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRecoveryAndDownload = useCallback(async () => {
    try {
      setIsLoading(true);
      await generateRecoveryAndDownload();
    } catch (error) {
      toast.error("Error downloading recovery file");
    } finally {
      setIsLoading(false);
    }
  }, [generateRecoveryAndDownload]);

  return (
    <OnboardingCard
      headerText="Download recovery file"
      subtitle="Use this recovery file to sign in to Wander Connect on a new device."
      onBackButtonClick={() => navigate("/account/backup-wallet")}
      isLoading={isLoading}>
      <Snackbar variant="info" title="About this file:">
        <Flex direction="row" gap={8} align="center">
          <XClose style={{ flexShrink: 0 }} height={17} width={17} color="var(--brand-color-error2)" />
          This file cannot be used to import your wallet into other wallet apps.
        </Flex>

        <Flex direction="row" gap={8} align="center">
          <XClose style={{ flexShrink: 0 }} height={17} width={17} color="transparent" />
          <span>
            Would you like to <Link to="/account/backup-wallet/full">export your wallet</Link> instead?
          </span>
        </Flex>

        <Flex direction="row" gap={8} align="center">
          <XClose style={{ flexShrink: 0 }} height={17} width={17} color="var(--brand-color-error2)" />
          This file cannot be used to recover your account if you lose access to your credentials.
        </Flex>
      </Snackbar>

      <Snackbar variant="success" title="Safer than a keyfile!">
        <p>
          If someone steals this file, they won't be able to access your wallet unless they also have access to your
          credentials.
        </p>
      </Snackbar>

      <Copyable
        style={{ padding: "0" }}
        isFullWidth
        label="Your wallet address"
        value={currentWallet.address}
        onClick={() => {
          copy(currentWallet.address);
        }}
      />

      <Button isFullWidth isDisabled={isLoading} onClick={handleGenerateRecoveryAndDownload}>
        Download
      </Button>
    </OnboardingCard>
  );
}
