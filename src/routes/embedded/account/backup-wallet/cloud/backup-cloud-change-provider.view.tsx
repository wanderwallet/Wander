import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Button, GoogleCloudIcon, ICloudIcon } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { CloudProvider } from "~utils/embedded/cloud/cloud.types";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupCloudChangeProviderEmbeddedView() {
  const { authStatus, setCloudProvider } = useEmbedded();
  const { back } = useLocation();

  const areButtonsDisabled = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  const isViewLoading = areButtonsDisabled;

  function handleChangeCloudProvider(cloudProvider: CloudProvider) {
    setCloudProvider(cloudProvider);
    back();
  }

  return (
    <OnboardingCard
      headerText={"Change cloud provider"}
      subtitle="Select a cloud provider to upload your recovery key to."
      isLoading={isViewLoading}>
      <Button
        onClick={() => handleChangeCloudProvider(CloudProvider.GoogleCloud)}
        variant="outlined"
        isFullWidth
        icon={<GoogleCloudIcon fontSize={24} />}>
        Google Cloud
      </Button>

      <Button
        onClick={() => handleChangeCloudProvider(CloudProvider.iCloud)}
        variant="outlined"
        isFullWidth
        icon={<ICloudIcon fontSize={24} />}
        href="/auth/import-wallet">
        iCloud
      </Button>
    </OnboardingCard>
  );
}
