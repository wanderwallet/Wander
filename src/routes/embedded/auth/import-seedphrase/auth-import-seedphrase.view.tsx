import copy from "copy-to-clipboard";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Row, SeedInput, Copyable } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AuthImportSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { navigate } = useLocation();
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const { importTempWallet, importedTempWalletAddress, deleteImportedTempWallet, registerWallet, wallets } =
    useEmbedded();

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

      setLoading(true);

      await importTempWallet(seedPhrase.join(" "));
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
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

      setLoading(true);

      await registerWallet("IMPORTED");
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error happened.");
    } finally {
      setLoading(false);
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
      headerText="Enter Seedphrase"
      subtitle="Would you like to add this wallet to your account?"
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={loading}>
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
        <Button variant="primary" size="md" onClick={handleAddWallet} isDisabled={loading}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to add your wallet to your account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={loading}>
      <SeedInput seedPhrase={seedPhrase} handleSubmit={handleImportWallet} handleInputChange={handleInputChange} />

      <Button isFullWidth size="md" onClick={handleImportWallet} isDisabled={loading}>
        Next
      </Button>
    </OnboardingCard>
  );
}
