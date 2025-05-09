import { AlertTriangle, XClose } from "@untitled-ui/icons-react";
import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Flex } from "~components/common/Flex";
import { Box, Button, Card, WanderFooter, Text } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupWalletRecoveryFileEmbeddedView() {
  const { navigate } = useLocation();
  const { generateRecoveryAndDownload } = useEmbedded();
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
      onBackButtonClick={() => navigate("/account/backup-wallet")}>

      <Flex
        direction="column"
        gap={12}
        style={{
          width: "100%",
          borderRadius: 8,
          padding: 12,
          borderColor: "#D6D6DD",
          borderWidth: 1,
          borderStyle: "solid",
          flexWrap: "wrap",
        }}>

        <Text variant="bodyMd" alignment="left" style={{ color: "#121212" }}>
          About this file:
        </Text>

        <Flex direction="row" gap={8} align="center">
          <XClose style={{ flexShrink: 0 }} height={17} width={17} color="var(--brand-color-error2)" />
          <Text variant="bodyXs" alignment="left" style={{ color: "#121212" }}>
            This file cannot be used to import your wallet into other wallet apps.
          </Text>
        </Flex>

        <Flex direction="row" gap={8} align="center">
          <XClose style={{ flexShrink: 0 }} height={17} width={17} color="var(--brand-color-error2)" />
          <Text variant="bodyXs" alignment="left" style={{ color: "#121212" }}>
            This file cannot be used to recover your account if you lose access to your credentials.
          </Text>
        </Flex>

        <Flex direction="row" gap={8} align="center">
          <AlertTriangle style={{ flexShrink: 0 }} height={17} width={17} color="#BD8802" />
          <Text variant="bodyXs" alignment="left" style={{ color: "#121212" }}>
            You'll need to sign-in with your authentication method and upload this file to recover your wallet.
          </Text>
        </Flex>

        <Flex direction="row" gap={8} align="center">
          <AlertTriangle style={{ flexShrink: 0 }} height={17} width={17} color="#BD8802" />
          <Text variant="bodyXs" alignment="left" style={{ color: "#121212" }}>
            If someone steals this file, they won't be able to access your wallet unless they also have access to your
            credentials.
          </Text>
        </Flex>

      </Flex>

      <Button isFullWidth isDisabled={isLoading} isLoading={isLoading} onClick={handleGenerateRecoveryAndDownload}>
        Download
      </Button>

    </OnboardingCard>
  );
}
