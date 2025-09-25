import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Button, GoogleCloudIcon, ICloudIcon } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { CloudProvider } from "~utils/embedded/cloud/cloud.types";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { navigate } from "wouter/use-hash-location";

export function AccountBackupCloudChangeProviderEmbeddedView() {
  const { authStatus, setCloudProvider } = useEmbedded();

  const isViewLoading = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  function handleChangeCloudProvider(cloudProvider: CloudProvider) {
    setCloudProvider(cloudProvider);
    navigate(EmbeddedPaths.AccountBackupCloud);
  }

  return (
    <OnboardingCard
      headerText={"Change cloud provider"}
      subtitle="Select a cloud provider to upload your recovery key to."
      isLoading={isViewLoading}
      onBackButtonClick={() => navigate(EmbeddedPaths.AccountBackupCloud)}>
      <Button
        onClick={() => handleChangeCloudProvider(CloudProvider.GOOGLE)}
        variant="outlined"
        isFullWidth
        icon={<GoogleCloudIcon fontSize={24} />}>
        Google Cloud
      </Button>

      <Button
        onClick={() => handleChangeCloudProvider(CloudProvider.APPLE)}
        variant="outlined"
        isFullWidth
        icon={<ICloudIcon fontSize={24} />}
        href="/auth/import-wallet">
        iCloud
      </Button>
    </OnboardingCard>
  );
}
