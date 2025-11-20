import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef, useState } from "react";
import { Button, Column, ICloudIcon, GoogleCloudIcon, Row, Text, Spacer, Copyable } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useAppleCloud } from "~utils/embedded/cloud/hooks/useAppleCloud";
import { useGoogleCloud } from "~utils/embedded/cloud/hooks/useGoogleCloud";
import { WalletService } from "~utils/wallets/wallets.service";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import copy from "copy-to-clipboard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { navigate } from "wouter/use-hash-location";
import { signOut } from "~utils/embedded/embedded.utils";
import { sleep } from "~utils/promises/sleep";
import { Loading } from "@arconnect/components-rebrand";
import { toast } from "react-toastify";
import { Upload01 } from "@untitled-ui/icons-react";
import { CloudOperationType, CloudProvider } from "~utils/embedded/cloud/cloud.types";
import type { RecoveryJSON } from "~utils/embedded/embedded.types";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { getPendingOperation, clearCloudAuthState, AUTH_REDIRECT_FLAG } from "~utils/embedded/cloud/cloud.utils";
import { isInsideIframe } from "~utils/embedded/iframe.utils";

export function AccountBackupCloudImportEmbeddedView() {
  const { authStatus, currentWallet, importTempWallet, recoverWallet, cloudBackup, setCloudBackup } = useEmbedded();

  const [isLoading, setIsLoading] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const pendingOperationProcessedRef = useRef(false);
  const isViewLoading = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";
  const provider = cloudBackup?.provider;
  const providerName = provider === CloudProvider.APPLE ? "iCloud" : "Google";

  const googleCloud = useGoogleCloud();
  const appleCloud = useAppleCloud();

  const handleOtherOptions = () => {
    navigate(EmbeddedPaths.AuthRestoreShares);
  };

  async function handleImportFromCloud() {
    if (!currentWallet) return;
    setIsLoading(true);
    try {
      let recoveryFileData: RecoveryJSON | null = null;

      if (cloudBackup?.provider === "GOOGLE") {
        await googleCloud.authenticate({
          type: CloudOperationType.IMPORT,
          fileId: cloudBackup?.fileId,
          provider: CloudProvider.GOOGLE,
        });
        recoveryFileData = await googleCloud.getFileContent(cloudBackup?.fileId);
      } else if (cloudBackup?.provider === "APPLE") {
        await appleCloud.authenticate({
          type: CloudOperationType.IMPORT,
          fileId: cloudBackup?.fileId,
          provider: CloudProvider.APPLE,
        });
        recoveryFileData = await appleCloud.getFileContent(cloudBackup?.fileId);
      }

      if (recoveryFileData) {
        if (WalletUtils.isJWK(recoveryFileData)) {
          const tempWallet = await importTempWallet(recoveryFileData);

          if (!tempWallet) {
            return alert(`Something isn't right`);
          }
        }

        await recoverWallet(recoveryFileData);

        await sleep(100);

        toast.success("Wallet imported successfully");
        navigate(EmbeddedPaths.AccountBackupCloudImportSuccess);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to import from cloud");
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

  useAsyncEffect(async () => {
    if (isInsideIframe()) return;
    if (pendingOperationProcessedRef.current) return;

    const wasRedirecting = localStorage.getItem(AUTH_REDIRECT_FLAG);
    if (!wasRedirecting) return;

    if (!googleCloud.isAuthenticated && !appleCloud.isAuthenticated) return;
    if (!currentWallet) return;

    const pendingOp = getPendingOperation();
    if (!pendingOp) {
      clearCloudAuthState();
      return;
    }

    if (pendingOp.type !== CloudOperationType.IMPORT || !cloudBackup) return;

    pendingOperationProcessedRef.current = true;

    try {
      if (pendingOp.type === CloudOperationType.IMPORT) {
        await handleImportFromCloud();
      }
    } finally {
      clearCloudAuthState();
      setIsLoading(false);
    }
  }, [googleCloud.isAuthenticated, appleCloud.isAuthenticated, currentWallet, cloudBackup]);

  useEffect(() => {
    return () => clearCloudAuthState();
  }, []);

  return (
    <OnboardingCard
      headerText="Connect wallet"
      hasCloseButton={false}
      onBackButtonClick={() => signOut(false)}
      isLoading={isViewLoading}>
      <Column>
        <Text variant="bodyMd">We found a wallet linked to</Text>
        <Row isFullWidth>
          {isBackupLoading ? <Loading /> : cloudBackup?.provider === "APPLE" ? <ICloudIcon /> : <GoogleCloudIcon />}
          <Text variant="bodyMd">{cloudBackup?.email || ""}</Text>
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
      <Column spacing="lg">
        <Button
          onClick={handleImportFromCloud}
          variant="primary"
          isFullWidth
          isDisabled={!cloudBackup}
          isLoading={isLoading || googleCloud.isLoading || appleCloud.isLoading}>
          Connect this wallet
        </Button>

        <Button
          variant="secondary"
          isFullWidth
          isDisabled={isViewLoading}
          onClick={handleOtherOptions}
          icon={<Upload01 height={24} width={24} />}>
          Import another wallet
        </Button>
        {((provider === CloudProvider.GOOGLE && googleCloud.isAuthenticated) ||
          (provider === CloudProvider.APPLE && appleCloud.isAuthenticated)) && (
          <Button onClick={handleSignout} variant="link" isDisabled={isViewLoading || isLoading}>
            Sign out of {providerName}
          </Button>
        )}
      </Column>
    </OnboardingCard>
  );
}
