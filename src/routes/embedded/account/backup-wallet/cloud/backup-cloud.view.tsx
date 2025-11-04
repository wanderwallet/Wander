import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef, useState } from "react";
import { Button, Column, ICloudIcon, GoogleCloudIcon, Row, Switch, Text, Tooltip, InfoIcon } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { CloudProvider, type AppDataFile } from "~utils/embedded/cloud/cloud.types";
import { useAppleCloud } from "~utils/embedded/cloud/hooks/useAppleCloud";
import { useGoogleCloud } from "~utils/embedded/cloud/hooks/useGoogleCloud";
import { WalletService } from "~utils/wallets/wallets.service";
import { navigate } from "wouter/use-hash-location";
import { browserInfo } from "~utils/browser-info/browser-info.utils";
import { sleep } from "~utils/promises/sleep";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import type { Wallet } from "~utils/embedded/embedded.types";
import { toast } from "react-toastify";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { DownloadRecoveryFileData } from "~utils/file";

export function AccountBackupCloudEmbeddedView() {
  const {
    authStatus,
    cloudProvider,
    currentWallet,
    lastRegisteredWallet,
    setCloudProvider,
    setCloudBackup,
    cloudBackup,
    generateRecovery,
  } = useEmbedded();

  const fileRef = useRef<AppDataFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);

  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isBackupLoading;

  const provider = cloudBackup?.provider || cloudProvider;
  const providerName = provider === CloudProvider.APPLE ? "iCloud" : "Google";

  const googleCloud = useGoogleCloud();
  const appleCloud = useAppleCloud();

  const handleComplete = async () => {
    if (lastRegisteredWallet) {
      await sleep(100);
      navigate(EmbeddedPaths.AccountCongratulations);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  async function handleStoreOnCloud() {
    let recoveryFileData: DownloadRecoveryFileData | null = null;
    try {
      if (!currentWallet) return;
      setIsLoading(true);

      recoveryFileData = await generateRecovery();
      const blob = new Blob([JSON.stringify(recoveryFileData)], { type: "application/json" });
      const fileName = "backup-recovery-file.json";
      const mimeType = "application/json";

      let googleEmail: string | null = null;

      if (!fileRef.current) {
        if (cloudProvider === CloudProvider.GOOGLE) {
          const { email } = await googleCloud.authenticate();
          googleEmail = email;
          fileRef.current = await googleCloud.uploadFile(blob, fileName, currentWallet.address, mimeType);
        } else if (cloudProvider === CloudProvider.APPLE) {
          await appleCloud.authenticate();
          fileRef.current = await appleCloud.uploadFile(blob, fileName, currentWallet.address, mimeType);
        }
      }

      if (fileRef.current) {
        const { cloudBackup, wallet } = await WalletService.createCloudBackup({
          walletId: currentWallet.id,
          fileId: fileRef.current.id,
          provider: cloudProvider,
          email: googleEmail,
        });

        setCloudBackup(cloudBackup, wallet as Wallet);

        if (!cloudBackup) throw new Error("Failed to create cloud backup");

        handleComplete();

        toast.success("Wallet backup created successfully");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to store on cloud");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteFromCloud() {
    try {
      if (!currentWallet || !cloudBackup) return;
      setIsLoading(true);

      fileRef.current = null;
      if (cloudBackup.provider === CloudProvider.GOOGLE) {
        await googleCloud.authenticate();
        await googleCloud.deleteFile(cloudBackup.fileId);
      } else if (cloudBackup.provider === CloudProvider.APPLE) {
        await appleCloud.authenticate();
        await appleCloud.deleteFile(cloudBackup.fileId);
      }

      const { wallet } = await WalletService.deleteCloudBackup({ walletId: currentWallet.id });
      setCloudBackup(null, wallet as Wallet);
      toast.success("Wallet backup deleted successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to delete from cloud");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignout() {
    if (!provider) return;

    setIsLoading(true);
    try {
      if (provider === CloudProvider.GOOGLE) {
        await googleCloud.revokeAuth();
      } else if (provider === CloudProvider.APPLE) {
        await appleCloud.revokeAuth();
      }
      toast.success(`Signed out of ${providerName} successfully`);
    } catch {
      toast.error(`Failed to sign out ${providerName}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (cloudProvider) return;
    const provider = browserInfo.isAppleDevice ? CloudProvider.APPLE : CloudProvider.GOOGLE;
    setCloudProvider(provider);
  }, []);

  useAsyncEffect(async () => {
    if (!currentWallet || cloudBackup !== undefined) return;
    setIsBackupLoading(true);
    try {
      const { cloudBackup: fetchedCloudBackup } = await WalletService.fetchCloudBackup({ walletId: currentWallet.id });
      setCloudBackup(fetchedCloudBackup);
    } catch (error) {
      console.error("Failed to fetch cloud backup:", error);
    } finally {
      setIsBackupLoading(false);
    }
  }, [currentWallet?.id, cloudBackup]);

  return (
    <OnboardingCard
      headerText="Store your recovery key on the cloud"
      subtitle="Upload your recovery key to the cloud to easily sign in and connect your wallet on new devices."
      hasBackButton={!lastRegisteredWallet}
      hasCloseButton={false}
      isLoading={isViewLoading}
      onBackButtonClick={() => navigate(EmbeddedPaths.AccountBackupFullWallet)}>
      <Column alignment="left">
        <Row justifyContent="between" isFullWidth>
          <Row justifyContent="start" isFullWidth>
            {provider === CloudProvider.APPLE ? <ICloudIcon /> : <GoogleCloudIcon />}
            <Text variant="bodyLg">
              Store{cloudBackup ? "d" : ""} on {provider === CloudProvider.APPLE ? "iCloud" : "Google Cloud"}
            </Text>
          </Row>
          {!cloudBackup && (
            <Switch size={31} isChecked={isCloudEnabled} handleChange={(e) => setIsCloudEnabled(e.target.checked)} />
          )}
        </Row>
        {!cloudBackup && (
          <>
            <Text variant="bodySm">
              Leaving this off will require you to re-import your wallet every time you use Wander Connect on a new
              device.
            </Text>
            <Button variant="link" isDisabled={isViewLoading} href={EmbeddedPaths.AccountBackupCloudChangeProvider}>
              Change cloud provider
            </Button>
          </>
        )}
      </Column>
      {/* <Spacer y={0.5} /> */}
      <div style={{ opacity: 0, height: 0 }} id="apple-sign-in-button" />
      <Column spacing="xl">
        <Column isFullWidth>
          {!cloudBackup ? (
            <Button
              onClick={handleStoreOnCloud}
              variant="primary"
              isFullWidth
              isLoading={isLoading || googleCloud.isLoading || appleCloud.isLoading}
              isDisabled={!isCloudEnabled || isBackupLoading || isLoading}>
              Store on cloud
            </Button>
          ) : (
            <Button
              onClick={handleDeleteFromCloud}
              variant="primary"
              isFullWidth
              isLoading={isLoading}
              isDisabled={isLoading}>
              Delete backup
              <Tooltip
                style={{ marginLeft: 4 }}
                width={240}
                content="Deletes your wallet backup from the cloud. Make sure you're signed in with the same cloud account you used to create the backup."
                position="top">
                <InfoIcon />
              </Tooltip>
            </Button>
          )}

          {lastRegisteredWallet && (
            <Button variant="secondary" isFullWidth isDisabled={isViewLoading} onClick={handleSkip}>
              Skip
            </Button>
          )}
        </Column>
        {((provider === CloudProvider.GOOGLE && googleCloud.isAuthenticated) ||
          (provider === CloudProvider.APPLE && appleCloud.isAuthenticated)) && (
          <Button onClick={handleSignout} variant="link" isDisabled={isViewLoading || isLoading}>
            Sign out of {providerName}
          </Button>
        )}
        <Button
          variant="link"
          isDisabled={isViewLoading}
          href="https://www.wander.app/help/what-is-a-wander-connect-recovery-file">
          What is a recovery file?
        </Button>
      </Column>
    </OnboardingCard>
  );
}
