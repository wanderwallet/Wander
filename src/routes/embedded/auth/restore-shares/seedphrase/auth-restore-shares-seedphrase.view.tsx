import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Card, Upload, Button, WanderFooter } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";

export function AuthRestoreSharesSeedphraseEmbeddedView() {
  const { navigate, back } = useLocation();
  const [loading, setLoading] = useState(false);
  const { currentWallet, recoverWallet } = useEmbedded();
  const walletAddress = currentWallet.address;
  const [jsonData, setJsonData] = useState<any>(null);

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
  };

  const handleRestore = useCallback(async () => {
    if (!jsonData) return;
    try {
      setLoading(true);
      await recoverWallet(jsonData);
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [jsonData, recoverWallet]);

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

  // TODO: Right now, because the auth-import-keyfile and seedphrase views are shared, it is possible to import a second wallet into the account!

  // TODO: Validate the wallet I imported is actually one of the ones on my account and show appropriate error messages and actions.

  // TODO: Request confirmation just line in import-keyfile

  return (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle="Enter your seedphrase to restore your wallet."
      onBackButtonClick={() => navigate("/auth/restore-shares")}
      isLoading={ loading }>

      <SeedInput seedPhrase={seedPhrase} handleSubmit={handleImportWallet} handleInputChange={handleInputChange} />

      <Button
        isFullWidth
        size="md"
        onClick={handleImportWallet}
        isLoading={loading}
        isDisabled={isSeedPhraseIncomplete}>
        Restore
      </Button>

      { /* <Button isFullWidth size="md" isLoading={loading} isDisabled={!jsonData} onClick={handleRestore}>
        Restore
      </Button> */ }
    </OnboardingCard>
  );
}
