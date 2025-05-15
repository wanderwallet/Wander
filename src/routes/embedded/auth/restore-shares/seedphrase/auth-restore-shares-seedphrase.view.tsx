import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, SeedInput, Row, Copyable } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import copy from "copy-to-clipboard";

export function AuthRestoreSharesSeedPhraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { navigate } = useLocation();
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    wallets,
    recoverWallet,
  } = useEmbedded();

  const validateSeedPhrase = useCallback(() => {
    const parsedSeedPhrase = seedPhrase.filter((word) => !!word.trim());

    if (![12, 18, 24].includes(parsedSeedPhrase.length)) {
      toast.error("Incomplete seedphrase.");

      return false;
    }

    return true;
  }, [seedPhrase])

  const handleImportWallet = useCallback(async () => {
    try {
      const isSeedPhraseValid = validateSeedPhrase();

      if (!isSeedPhraseValid) return;

      setLoading(true);

      await importTempWallet(seedPhrase.join(" "));
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  }, [seedPhrase]);

  const handleRecoverWallet = useCallback(async () => {
    try {
      const isSeedPhraseValid = validateSeedPhrase();

      if (!isSeedPhraseValid) return;

      const isWalletPresent = wallets.some(({ address }) => address === importedTempWalletAddress);

      if (!isWalletPresent) {
        toast.error("This wallet is not part of your account.");

        return;
      }

      setLoading(true);

      await recoverWallet(seedPhrase.join(" "));
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error happened.");
    } finally {
      setLoading(false);
    }
  }, [seedPhrase, wallets, importedTempWalletAddress]);

  const handleInputChange = useCallback((index: number, value: string) => {
    setSeedPhrase((prevSeedPhrase) => {
      const newSeedPhrase = [...prevSeedPhrase];
      newSeedPhrase[index] = value;
      return newSeedPhrase;
    });
  }, []);

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle="Confirm your wallet to restore it."
      onBackButtonClick={() => navigate("/auth/restore-shares")}
      isLoading={ loading }>
      <Copyable
        isFullWidth
        style={{ padding: 0 }}
        label="Your wallet address"
        onClick={() => {
          copy(importedTempWalletAddress);
        }}
        value={importedTempWalletAddress}
      />
      <Row>
        <Button variant="secondary" size="md" onClick={deleteImportedTempWallet} isDisabled={loading}>
          No, try again
        </Button>
        <Button variant="primary" size="md" onClick={handleRecoverWallet} isDisabled={loading}>
          Yes, restore
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
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
        isDisabled={loading}>
        Next
      </Button>

    </OnboardingCard>
  );
}
