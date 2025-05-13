import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";

import { Row, Upload, Copyable, Button, Text } from "~components/embed";
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";

export function AuthImportKeyfileEmbeddedView() {
  const { navigate } = useLocation();
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);

  const handleJsonParse = async (jsonData: any) => {
    try {
      setJsonData(jsonData);
      setLoading(true);
      setFileError(false);

      if (jsonData) {
        if (!WalletUtils.isJWK(jsonData)) {
          setFileError(true);
          setLoading(false);
          return;
        }
        const tempWallet = await importTempWallet(jsonData);

        if (!tempWallet) {
          setLoading(false);
          return toast.error(`Something isn't right`);
        }
        setLoading(false);
        return tempWallet;
      } else {
        setFileError(true);
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet,
    wallets,
  } = useEmbedded();

  const handleAddWallet = useCallback(async () => {
    try {
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

      //await recoverWallet(jsonData);
      await registerWallet("IMPORTED");
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error happened.");
    } finally {
      setLoading(false);
    }
  }, [registerWallet, jsonData, wallets, importedTempWalletAddress]);

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText="Import Keyfile"
      subtitle="Would you like to add this wallet to your account?"
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
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
        <Button variant="primary" size="md" onClick={handleAddWallet} isDisabled={loading}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Import Keyfile"
      subtitle="Upload your private key to add your wallet to your account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={ loading }>

      <Upload
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Recovering account..."}
        onFileParse={handleJsonParse}
      />

      {fileError && (
        <Text alignment="left" variant="bodySm" style={{ color: "#D22B1F", alignSelf: "flex-start", marginTop: 8 }}>
          Error: incorrect file format
        </Text>
      )}

    </OnboardingCard>
  );
}
