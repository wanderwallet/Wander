import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, SeedInput } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";
import { WanderFooter } from "~components/embed/ui/templates/wander-footer/WanderFooter";
export function AccountImportSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { back } = useLocation();

  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const { importTempWallet, importedTempWalletAddress, deleteImportedTempWallet, registerWallet } = useEmbedded();

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
      await registerWallet("IMPORTED");
    } catch (error) {
      toast.error(error);
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

  const isSeedPhraseIncomplete = useMemo(() => {
    if (seedPhrase.length !== 12) return true;
    return seedPhrase.some((word) => word.trim() === "");
  }, [seedPhrase]);

  return (
    <Card
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to connect your wallet to your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto">
      <SeedInput handleSubmit={handleImportWallet} seedPhrase={seedPhrase} handleInputChange={handleInputChange} />
      <Button
        isFullWidth
        size="md"
        onClick={handleImportWallet}
        isLoading={loading}
        isDisabled={isSeedPhraseIncomplete}>
        Recover
      </Button>
    </Card>
  );
}
