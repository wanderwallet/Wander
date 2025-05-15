import copy from "copy-to-clipboard";
import { Copyable, Button } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountConfirmationEmbeddedView() {
  const { wallets, lastRegisteredWallet, clearLastRegisteredWallet } = useEmbedded();
  const { navigate } = useLocation();

  return (
    <OnboardingCard
      headerText={
        wallets.length === 1
          ? `Congratulations, your account\n has been created!`
          : `Congratulations, your wallet has been ${
              lastRegisteredWallet.source.type === "IMPORTED" ? "imported" : "created"
            }!`
      }
      hasBackButton={ false }>

      <Copyable
        isFullWidth
        style={{ padding: 0 }}
        label="Your wallet address"
        value={lastRegisteredWallet.address}
        onClick={() => {
          copy(lastRegisteredWallet.address);
        }}
      />

      <Button isFullWidth size="md" onClick={() => clearLastRegisteredWallet()}>
        Continue
      </Button>

    </OnboardingCard>
  );
}
