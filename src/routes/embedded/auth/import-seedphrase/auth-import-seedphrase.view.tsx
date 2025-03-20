import copy from "copy-to-clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Row,
  SeedInput,
  Copyable,
  WanderFooter
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AuthImportSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { navigate, back } = useLocation();
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet
  } = useEmbedded();

  const handleImportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (!seedPhrase.length) return;
      await importTempWallet(seedPhrase.join(" "));
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [seedPhrase]);

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
    <Card
      headerText="Recover your account"
      subtitle="Enter seedphrase"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(`/auth/recover-account`)}
      size="auto"
    >
      <Copyable
        isFullWidth
        label="Your wallet address"
        onClick={() => {
          copy(importedTempWalletAddress);
        }}
        value={importedTempWalletAddress}
      />
      <Row>
        <Button
          variant="secondary"
          size="md"
          onClick={deleteImportedTempWallet}
        >
          No, try again
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => registerWallet("IMPORTED")}
          isLoading={loading}
        >
          Yes, recover
        </Button>
      </Row>
    </Card>
  ) : (
    <Card
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to connect your wallet to your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto"
    >
      <SeedInput
        seedPhrase={seedPhrase}
        handleSubmit={handleImportWallet}
        handleInputChange={handleInputChange}
      />
      <Button
        isFullWidth
        size="md"
        onClick={handleImportWallet}
        isLoading={loading}
      >
        Import
      </Button>
    </Card>
  );
}
