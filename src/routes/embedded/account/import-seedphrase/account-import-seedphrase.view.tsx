import copy from "copy-to-clipboard";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, SeedInput, WanderFooter } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountImportSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { back } = useLocation();

  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet
  } = useEmbedded();

  const handleInputChange = useCallback((index: number, value: string) => {
    setSeedPhrase((prevSeedPhrase) => {
      const newSeedPhrase = [...prevSeedPhrase];
      newSeedPhrase[index] = value;
      return newSeedPhrase;
    });
  }, []);

  const handleImportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (!seedPhrase.length) return;
      await importTempWallet(seedPhrase.join(" "));
      await registerWallet("imported");
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [seedPhrase]);

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return (
    <Card
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to connect your wallet to your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto"
    >
      <SeedInput
        handleSubmit={handleImportWallet}
        seedPhrase={seedPhrase}
        handleInputChange={handleInputChange}
      />
      <Button
        isFullWidth
        size="md"
        onClick={handleImportWallet}
        isLoading={loading}
      >
        Recover
      </Button>
    </Card>
  );
}
