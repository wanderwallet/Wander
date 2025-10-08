import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useState } from "react";
import { Button, Column, ICloudIcon, GoogleCloudIcon, Row, Text, Spacer, Copyable } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useAppleCloud } from "~utils/embedded/cloud/hooks/useAppleCloud";
import { useGoogleCloud } from "~utils/embedded/cloud/hooks/useGoogleCloud";
import { WalletService } from "~utils/wallets/wallets.service";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import copy from "copy-to-clipboard";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { navigate } from "wouter/use-hash-location";
import { signOut } from "~utils/embedded/embedded.utils";
import { sleep } from "~utils/promises/sleep";
import { Loading } from "@arconnect/components-rebrand";
import { toast } from "react-toastify";

const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
const containerIdentifier = import.meta.env?.VITE_APPLE_CONTAINER_IDENTIFIER;
const apiToken = import.meta.env?.VITE_APPLE_API_TOKEN;

export function AccountBackupCloudImportEmbeddedView() {
  const { authStatus, currentWallet, importTempWallet, recoverWallet, cloudBackup, setCloudBackup } = useEmbedded();

  const [isLoading, setIsLoading] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const isViewLoading = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  const googleCloud = useGoogleCloud(clientId);
  const appleCloud = useAppleCloud(containerIdentifier, apiToken);

  const handleOtherOptions = () => {
    navigate(EmbeddedPaths.AuthRestoreShares);
  };

  async function handleImportFromCloud() {
    if (!currentWallet) return;
    setIsLoading(true);
    try {
      let jwk: JWKInterface | null = null;

      if (cloudBackup?.provider === "GOOGLE") {
        await googleCloud.authenticate();
        jwk = await googleCloud.getFileContent(cloudBackup?.fileId);
      } else if (cloudBackup?.provider === "APPLE") {
        await appleCloud.authenticate();
        jwk = await appleCloud.getFileContent(cloudBackup?.fileId);
      }

      if (jwk) {
        const tempWallet = await importTempWallet(jwk);

        if (!tempWallet) {
          return alert(`Something isn't right`);
        }

        await recoverWallet(jwk);

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

        <Button variant="secondary" isFullWidth isDisabled={isViewLoading} onClick={handleOtherOptions}>
          Other options
        </Button>
      </Column>
    </OnboardingCard>
  );
}
