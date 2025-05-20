import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { Copyable, Row, Button, SeedInput } from "~components/embed/ui";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AuthRecoverAccountSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(""));
  const { navigate, back } = useLocation();
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts,
    fetchRecoverableAccountWallets,
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

  const handleRecover = async () => {
    try {
      setLoading(true);
      const recoverableAccounts = await fetchRecoverableAccounts();
      if (recoverableAccounts.length === 1) {
        await fetchRecoverableAccountWallets(recoverableAccounts[0]);
        navigate(EmbeddedPaths.Auth);
      } else if (recoverableAccounts.length > 1) {
        navigate(EmbeddedPaths.AuthRecoverAccountSelect);
      } else {
        toast.error("No recoverable accounts found");
      }
      setLoading(false);
    } catch (error) {
      toast.error(error?.message || "Error recovering account");
      setLoading(false);
    }
  };

  useEffect(() => {
    deleteImportedTempWallet();
    clearRecoverableAccounts();
  }, []);

  const isSeedPhraseIncomplete = useMemo(() => {
    if (seedPhrase.length !== 12) return true;
    return seedPhrase.some((word) => word.trim() === "");
  }, [seedPhrase]);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText="Enter Seedphrase"
      subtitle="Would you like to add this wallet to your account?"
      onBackButtonClick={() => navigate(`/auth/recover-account`)}
      isLoading={loading}
      style={{ gap: 24 }}>
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
        <Button variant="primary" size="md" onClick={handleRecover} isDisabled={loading}>
          Yes, recover
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to recover your wallet."
      onBackButtonClick={() => navigate(`/auth/recover-account`)}
      isLoading={loading}>
      <SeedInput seedPhrase={seedPhrase} handleSubmit={handleImportWallet} handleInputChange={handleInputChange} />
      <Button
        isFullWidth
        size="md"
        onClick={handleImportWallet}
        isDisabled={loading || isSeedPhraseIncomplete}>
        {isSeedPhraseIncomplete ? "Complete seedphrase" : "Next"}
      </Button>
    </OnboardingCard>
  );
}
