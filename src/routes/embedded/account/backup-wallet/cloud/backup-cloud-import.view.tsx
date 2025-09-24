import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useState } from "react";
import { Button, Column, ICloudIcon, GoogleCloudIcon, Row, Text, Spacer, Copyable } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useAppleCloud } from "~utils/embedded/cloud/hooks/useAppleCloud";
import { useGoogleCloud } from "~utils/embedded/cloud/hooks/useGoogleCloud";
import { WalletService, type CloudBackup } from "~utils/wallets/wallets.service";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import copy from "copy-to-clipboard";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { navigate } from "wouter/use-hash-location";

const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
const containerIdentifier = import.meta.env?.VITE_APPLE_CONTAINER_IDENTIFIER;
const apiToken = import.meta.env?.VITE_APPLE_API_TOKEN;

export function AccountBackupCloudImportEmbeddedView() {
  const { authStatus, currentWallet, importTempWallet, recoverWallet } = useEmbedded();

  const [isLoading, setIsLoading] = useState(false);
  const [cloudBackup, setCloudBackup] = useState<CloudBackup | null>(null);

  const areButtonsDisabled = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  const isViewLoading = areButtonsDisabled;

  const googleCloud = useGoogleCloud(clientId);
  const appleCloud = useAppleCloud(containerIdentifier, apiToken);

  const handleSkip = () => {};

  async function handleImportFromCloud() {
    if (!currentWallet) return;
    setIsLoading(true);
    try {
      let jwk: JWKInterface | null = null;

      if (cloudBackup?.provider === "GOOGLE") {
        const success = await googleCloud.authenticate();
        if (!success) throw new Error("Failed to authenticate with Google Drive");
        jwk = await googleCloud.getFile(cloudBackup?.fileId);
      } else if (cloudBackup?.provider === "APPLE") {
        const success = await appleCloud.authenticate();
        if (!success) throw new Error("Failed to authenticate with Apple Drive");
        jwk = await appleCloud.getFile(cloudBackup?.fileId);
      }

      if (jwk) {
        const tempWallet = await importTempWallet(jwk);

        if (!tempWallet) {
          return alert(`Something isn't right`);
        }

        await recoverWallet(jwk);

        navigate(EmbeddedPaths.WalletHomeEmbeddedView);
      }
    } catch (error) {
      console.error("Failed to import from cloud:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useAsyncEffect(async () => {
    if (!currentWallet) return;
    const fetchCloudBackup = async () => {
      const { cloudBackup } = await WalletService.fetchCloudBackup({ walletId: currentWallet.id });
      setCloudBackup(cloudBackup);
    };
    fetchCloudBackup();
  }, [currentWallet]);

  return (
    <OnboardingCard
      headerText="Import your recovery key from the cloud"
      hasBackButton={false}
      hasCloseButton={false}
      isLoading={isViewLoading}>
      <Column>
        <Text variant="bodyMd">We found a wallet linked to</Text>
        <Row isFullWidth>
          {cloudBackup?.provider === "APPLE" ? <ICloudIcon /> : <GoogleCloudIcon />}
          <Text variant="bodyMd">{cloudBackup?.email}</Text>
        </Row>
      </Column>
      <Spacer y={0.1} />
      <Copyable
        style={{ padding: "0" }}
        isFullWidth
        label="Your wallet address"
        value={currentWallet.address}
        onClick={() => {
          copy(currentWallet.address);
        }}
      />
      <div style={{ opacity: 0, height: 0 }} id="apple-sign-in-button" />
      <Column spacing="xl">
        <Column isFullWidth>
          <Button
            onClick={handleImportFromCloud}
            variant="primary"
            isFullWidth
            isDisabled={!cloudBackup}
            isLoading={isLoading || googleCloud.isLoading || appleCloud.isLoading}>
            Import from cloud
          </Button>

          <Button variant="secondary" isFullWidth isDisabled={areButtonsDisabled} onClick={handleSkip}>
            Skip
          </Button>
        </Column>
      </Column>
    </OnboardingCard>
  );
}
