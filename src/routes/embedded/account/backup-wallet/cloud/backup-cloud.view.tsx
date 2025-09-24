import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useState } from "react";
import { Button, Column, ICloudIcon, GoogleCloudIcon, Row, Spacer, Switch, Text } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { CloudProvider } from "~utils/embedded/cloud/cloud.types";
import { useGoogleDrive } from "~utils/embedded/cloud/google/hooks/useGoogleDrive";
import { useAppleDrive } from "~utils/embedded/cloud/apple";
import Arweave from "arweave";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const containerIdentifier = import.meta.env.VITE_APPLE_CONTAINER_IDENTIFIER;
const apiToken = import.meta.env.VITE_APPLE_API_TOKEN;

export function AccountBackupCloudEmbeddedView() {
  const { authStatus, cloudProvider } = useEmbedded();

  const [isLoading, setIsLoading] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isLoading;

  const isViewLoading = areButtonsDisabled;

  const googleDrive = useGoogleDrive(clientId);
  const appleDrive = useAppleDrive(containerIdentifier, apiToken);

  async function handleStoreOnCloud() {
    setIsLoading(true);
    try {
      const arweave = new Arweave({});
      const jwk = await arweave.wallets.generate();
      const blob = new Blob([JSON.stringify(jwk)], { type: "application/json" });
      const fileName = "recovery-key.json";
      const mimeType = "application/json";

      if (cloudProvider === CloudProvider.GoogleCloud) {
        const success = await googleDrive.authenticate();
        if (!success) return;
        const fileId = "1VER6Zp5b_-tTp3QBafUJw9U4Q9KHd814au4rrrI1R3HEbbEMjA";
        const foundFile = await googleDrive.getFile(fileId);
        if (foundFile) {
          const updatedFile = await googleDrive.updateFile(fileId, blob, fileName, mimeType);
          console.log({ updatedFile });
        } else {
          const file = await googleDrive.uploadFile(blob, fileName, mimeType);
          console.log({ file });
        }
      } else if (cloudProvider === CloudProvider.iCloud) {
        const success = await appleDrive.authenticate();
        if (!success) return;
        const fileId = "wallet-backup-1";
        const foundFile = await appleDrive.getFile(fileId);
        if (foundFile) {
          const updatedFile = await appleDrive.updateFile(fileId, blob, fileName, mimeType);
          console.log({ updatedFile });
        } else {
          const file = await appleDrive.uploadFile(blob, fileName, mimeType);
          console.log({ file });
        }
      }
    } catch (error) {
      console.error("Failed to store on cloud:", error);
    } finally {
      setIsLoading(false);
    }
  }

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
            isLoading={googleDrive.isLoading || appleDrive.isLoading}
            isDisabled={!isCloudEnabled}>
            Store on cloud
          </Button>

          <Button variant="secondary" isFullWidth isDisabled={areButtonsDisabled}>
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
