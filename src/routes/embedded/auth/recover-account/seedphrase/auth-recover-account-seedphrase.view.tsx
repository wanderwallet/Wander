import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";

import {
  Card,
  Copyable,
  Row,
  Button,
  SeedInput,
  WanderFooter
} from "~components/embed/ui";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";

export function AuthRecoverAccountSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(""));
  const { navigate, back } = useLocation();
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet,
    wallets,
    recoverWallet
  } = useEmbedded();

  const handleImportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (!seedPhrase.length) return;
      await importTempWallet(seedPhrase.join(" "));
    } catch (error) {
      toast.error(error);
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

  const handleRecover = useCallback(async () => {
    try {
      setLoading(true);
      const isWalletPresent = wallets.some(
        ({ address }) => address === importedTempWalletAddress
      );
      if (isWalletPresent) {
        await recoverWallet(seedPhrase.join(" "));
      } else {
        toast.error("Wallet not found!");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [registerWallet, seedPhrase, wallets, importedTempWalletAddress]);

  useEffect(() => {
    deleteImportedTempWallet();
  }, []);

  const isSeedPhraseIncomplete = useMemo(() => {
    if (seedPhrase.length !== 12) return true;
    return seedPhrase.some((word) => word.trim() === "");
  }, [seedPhrase]);

  return importedTempWalletAddress ? (
    <Card
      headerText="Enter Seedphrase"
      subtitle="Would you like to add this wallet to your account?"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(`/auth/recover-account`)}
      style={{ gap: 24 }}
      size="auto"
    >
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
          onClick={handleRecover}
          isLoading={loading}
        >
          Yes, recover
        </Button>
      </Row>
    </Card>
  ) : (
    <Card
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to recover your wallet."
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
        isDisabled={isSeedPhraseIncomplete}
      >
        {isSeedPhraseIncomplete ? "Complete seedphrase" : "Next"}
      </Button>
    </Card>
  );
}
