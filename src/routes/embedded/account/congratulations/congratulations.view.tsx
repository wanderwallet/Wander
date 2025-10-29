import copy from "copy-to-clipboard";
import { navigate } from "wouter/use-hash-location";
import { Button, Copyable, Spacer } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { sleep } from "~utils/promises/sleep";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function CongratulationsEmbeddedView() {
  const { lastRegisteredWallet, clearLastRegisteredWallet } = useEmbedded();

  async function handleDone() {
    clearLastRegisteredWallet();
    await sleep(100);
    navigate(EmbeddedPaths.WalletHomeEmbeddedView);
  }

  return (
    <OnboardingCard
      headerText="Congratulations, your account has been created!"
      headerTextVariant="headingLg"
      hasBackButton={false}>
      <Copyable
        style={{ padding: "0", marginTop: 20 }}
        isFullWidth
        label="Your account address"
        value={lastRegisteredWallet?.address}
        onClick={() => {
          copy(lastRegisteredWallet?.address);
        }}
      />
      <Spacer y={0.75} />
      <Button isFullWidth onClick={handleDone}>
        Done
      </Button>
    </OnboardingCard>
  );
}
