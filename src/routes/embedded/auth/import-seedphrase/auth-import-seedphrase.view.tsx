import copy from "copy-to-clipboard";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Row, SeedInput, Copyable } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AuthImportSeedphraseEmbeddedView() {
  const { navigate } = useLocation();
  const { importTempWallet, importedTempWalletAddress, deleteImportedTempWallet, registerWallet, wallets, authStatus } =
    useEmbedded();

  // Loading state:

  const [isLoading, setIsLoading] = useState(false);

  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isLoading;

  const areButtonsDisabled = isViewLoading;

  // Seed phrase:

  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);

  const validateSeedPhrase = useCallback(() => {
    const parsedSeedPhrase = seedPhrase.filter((word) => !!word.trim());

    if (![12, 18, 24].includes(parsedSeedPhrase.length)) {
      toast.error("Incomplete seedphrase.");

      return false;
    }

    return true;
  }, [seedPhrase]);

  const handleImportWallet = useCallback(async () => {
    try {
      const isSeedPhraseValid = validateSeedPhrase();

      if (!isSeedPhraseValid) return;

      setIsLoading(true);

      await importTempWallet(seedPhrase.join(" "));
    } catch (error) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [seedPhrase]);

  const handleAddWallet = useCallback(async () => {
    try {
      const isSeedPhraseValid = validateSeedPhrase();

      if (!isSeedPhraseValid) return;

      const isWalletPresent = wallets.some(({ address }) => address === importedTempWalletAddress);

      if (isWalletPresent) {
        toast.error("This wallet was already added to your account.");

        return;
      }

      if (wallets.length > 0) {
        toast.error("Can't add more than one wallet to your account.");

        return;
      }

      setIsLoading(true);
      await registerWallet("IMPORTED");
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error happened.");
    } finally {
      setIsLoading(false);
    }
  }, [registerWallet, seedPhrase, wallets, importedTempWalletAddress]);

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
      headerText={authStatus === "noWallets" ? "Enter Seedphrase" : "Restore Wallet"}
      subtitle="Would you like to add this wallet to your account?"
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={isViewLoading}>
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
        <Button variant="secondary" size="md" onClick={deleteImportedTempWallet} isDisabled={areButtonsDisabled}>
          No, try again
        </Button>
        <Button variant="primary" size="md" onClick={handleAddWallet} isDisabled={areButtonsDisabled}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText={authStatus === "noWallets" ? "Enter Seedphrase" : "Restore Wallet"}
      subtitle="Enter your seedphrase to add your wallet to your account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={isViewLoading}>
      <SeedInput seedPhrase={seedPhrase} handleSubmit={handleImportWallet} handleInputChange={handleInputChange} />

      <Button isFullWidth size="md" onClick={handleImportWallet} isDisabled={areButtonsDisabled}>
        Next
      </Button>
    </OnboardingCard>
  );
}
