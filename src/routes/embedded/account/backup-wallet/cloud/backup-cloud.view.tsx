import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useState } from "react";
import { Button, Column, ICloudIcon, GoogleCloudIcon, Row, Switch, Text } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { CloudProvider, type AppDataFile } from "~utils/embedded/cloud/cloud.types";
import { useAppleCloud } from "~utils/embedded/cloud/hooks/useAppleCloud";
import { useGoogleCloud } from "~utils/embedded/cloud/hooks/useGoogleCloud";
import { WalletService } from "~utils/wallets/wallets.service";
import { navigate } from "wouter/use-hash-location";
import { browserInfo } from "~utils/browser-info/browser-info.utils";
import { sleep } from "~utils/promises/sleep";

const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
const containerIdentifier = import.meta.env?.VITE_APPLE_CONTAINER_IDENTIFIER;
const apiToken = import.meta.env?.VITE_APPLE_API_TOKEN;

export function AccountBackupCloudEmbeddedView() {
  const {
    authStatus,
    cloudProvider,
    getDecryptedWallet,
    currentWallet,
    clearLastRegisteredWallet,
    lastRegisteredWallet,
    setCloudProvider,
  } = useEmbedded();

  const [isLoading, setIsLoading] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);

  const areButtonsDisabled = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  const isViewLoading = areButtonsDisabled;

  const googleCloud = useGoogleCloud(clientId);
  const appleCloud = useAppleCloud(containerIdentifier, apiToken);

  const handleComplete = async () => {
    if (lastRegisteredWallet) clearLastRegisteredWallet();
    await sleep(100);
    navigate(EmbeddedPaths.WalletHomeEmbeddedView);
  };

  const handleSkip = () => {
    handleComplete();
  };

  async function handleStoreOnCloud() {
    if (!currentWallet) return;
    setIsLoading(true);
    try {
      const wallet = await getDecryptedWallet();
      const blob = new Blob([JSON.stringify(wallet.keyfile)], { type: "application/json" });
      const fileName = "backup-jwk.json";
      const mimeType = "application/json";

      let file: AppDataFile | null = null;

      if (cloudProvider === CloudProvider.GoogleCloud) {
        const success = await googleCloud.authenticate();
        if (!success) throw new Error("Failed to authenticate with Google Drive");
        file = await googleCloud.uploadFile(blob, fileName, currentWallet.address, mimeType);
      } else if (cloudProvider === CloudProvider.iCloud) {
        const success = await appleCloud.authenticate();
        if (!success) throw new Error("Failed to authenticate with Apple Drive");
        file = await appleCloud.uploadFile(blob, fileName, currentWallet.address, mimeType);
      }

      if (file) {
        const { cloudBackup } = await WalletService.createCloudBackup({
          walletId: currentWallet.id,
          fileId: file.id,
          email: "wander@wander.app",
          provider: cloudProvider === CloudProvider.iCloud ? "APPLE" : "GOOGLE",
        });

        console.log({ file, cloudBackup });

        // Complete the onboarding flow after successful backup
        handleComplete();
      }
    } catch (error) {
      console.error("Failed to store on cloud:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (cloudProvider) return;
    const provider = browserInfo.isAppleDevice ? CloudProvider.iCloud : CloudProvider.GoogleCloud;
    setCloudProvider(provider);
  }, []);

  return (
    <OnboardingCard
      headerText="Store your recovery key on the cloud"
      subtitle="Upload your recovery key to the cloud to easily sign in and connect your wallet on new devices."
      hasBackButton={false}
      hasCloseButton={false}
      isLoading={isViewLoading}>
      <Column alignment="left">
        <Row justifyContent="between" isFullWidth>
          <Row justifyContent="start" isFullWidth>
            {cloudProvider === CloudProvider.iCloud ? <ICloudIcon /> : <GoogleCloudIcon />}
            <Text variant="bodyLg">Store on {cloudProvider}</Text>
          </Row>
          <Switch size={31} isChecked={isCloudEnabled} handleChange={(e) => setIsCloudEnabled(e.target.checked)} />
        </Row>
        <Text variant="bodySm">
          Leaving this off will require you to re-import your wallet every time you use Wander Connect on a new device.
        </Text>
        <Button variant="link" isDisabled={areButtonsDisabled} href={EmbeddedPaths.AccountBackupCloudChangeProvider}>
          Change cloud provider
        </Button>
      </Column>
      {/* <Spacer y={0.5} /> */}
      <div style={{ opacity: 0, height: 0 }} id="apple-sign-in-button" />
      <Column spacing="xl">
        <Column isFullWidth>
          <Button
            onClick={handleStoreOnCloud}
            variant="primary"
            isFullWidth
            isLoading={isLoading || googleCloud.isLoading || appleCloud.isLoading}
            isDisabled={!isCloudEnabled}>
            Store on cloud
          </Button>

          <Button variant="secondary" isFullWidth isDisabled={areButtonsDisabled} onClick={handleSkip}>
            Skip
          </Button>
        </Column>
        <Button
          variant="link"
          isDisabled={areButtonsDisabled}
          href="https://www.wander.app/help/what-is-a-wander-connect-recovery-file">
          What is a recovery file?
        </Button>
      </Column>
    </OnboardingCard>
  );
}
