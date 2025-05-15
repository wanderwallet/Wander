import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { Row, Button, Copyable, Upload, Text } from "~components/embed";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AuthRecoverAccountKeyfileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState(false);
  const { navigate, back } = useLocation();

  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts,
  } = useEmbedded();

  const handleJsonParse = async (jsonData: any) => {
    try {
      setLoading(true);
      if (jsonData) {
        setFileError(false);
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

  const handleRecover = async () => {
    try {
      setLoading(true);
      await fetchRecoverableAccounts();
      setLoading(false);
      navigate("/auth/recover-account/authentication");
    } catch (error) {
      toast.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    deleteImportedTempWallet();
    clearRecoverableAccounts();
  }, []);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText="Import Keyfile"
      subtitle="Upload your private key to recover your account."
      onBackButtonClick={() => navigate(`/auth/recover-account`)}
      isLoading={ loading }>
      <Text>Would you like to recover this account?</Text>
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
        <Button variant="primary" size="md" onClick={() => handleRecover()} isDisabled={loading}>
          Yes, recover
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Import Keyfile"
      subtitle="Upload your private key to recover your account."
      onBackButtonClick={() => navigate(`/auth/recover-account`)}
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
        <Text alignment="left" variant="bodySm" style={{ color: "#D22B1F", alignSelf: "flex-start", marginTop: -20 }}>
          Error: incorrect file format
        </Text>
      )}
    </OnboardingCard>
  );
}
