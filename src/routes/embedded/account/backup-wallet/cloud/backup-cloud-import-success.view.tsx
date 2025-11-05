import copy from "copy-to-clipboard";
import { navigate } from "wouter/use-hash-location";
import { Button, Column, Copyable, Spacer, Text, Wallet2Icon } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AccountBackupCloudImportSuccessEmbeddedView() {
  const { currentWallet } = useEmbedded();

  async function handleDone() {
    navigate(EmbeddedPaths.WalletHomeEmbeddedView);
  }

  return (
    <OnboardingCard headerTextVariant="headingLg" hasBackButton={false}>
      <Column spacing="lg">
        <Wallet2Icon />
        <Text variant="headingLg">Wallet connected</Text>
        <Text alignment="center" variant="bodyMd">
          Congratulations, your wallet has been successfully connected.
        </Text>
      </Column>
      <Copyable
        style={{ padding: "0", marginTop: 20 }}
        isFullWidth
        label="Your account address"
        value={currentWallet?.address}
        onClick={() => {
          copy(currentWallet?.address);
        }}
      />
      <Spacer y={0.75} />
      <Button isFullWidth onClick={handleDone}>
        Continue to app
      </Button>
    </OnboardingCard>
  );
}
