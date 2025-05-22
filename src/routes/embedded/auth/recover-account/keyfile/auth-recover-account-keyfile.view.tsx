import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { Row, Button, Copyable, Upload, Text } from "~components/embed";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useWalletUpload } from "~utils/upload/wallet/use-wallet-upload.hook";

export function AuthRecoverAccountKeyfileEmbeddedView() {
  const { navigate } = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);

  const {
    importTempWallet,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts,
    fetchRecoverableAccountWallets,
  } = useEmbedded();

  const {
    data: uploadData,
    isLoading: isUploading,
    error: uploadError,
    importedWalletAddress,
    parse: parseUpload,
    reset: resetUpload,
  } = useWalletUpload({
    wallets: [],
    importTempWallet,
    allowRecoveryFile: false,
    mustWalletExist: false,
  });

  const areButtonsDisabled = isRecovering || isUploading;
  const isViewLoading = isRecovering;

  const handleRecover = async () => {
    try {
      if (areButtonsDisabled) return;

      if (uploadError) {
        toast.error(uploadError);

        return;
      }

      if (!WalletUtils.isJWK(uploadData)) {
        toast.error("Invalid file.");

        return;
      }

      setIsRecovering(true);

      const recoverableAccounts = await fetchRecoverableAccounts();

      if (recoverableAccounts.length === 1) {
        await fetchRecoverableAccountWallets(recoverableAccounts[0]);
        navigate(EmbeddedPaths.Auth);
      } else if (recoverableAccounts.length > 1) {
        navigate("/auth/recover-account/select");
      } else {
        toast.error("No recoverable accounts found");
        setIsRecovering(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error while recovering account.");
      setIsRecovering(false);
    }
  };

  const handleTryAgain = () => {
    resetUpload();
    deleteImportedTempWallet();
  };

  useEffect(() => {
    deleteImportedTempWallet();
    clearRecoverableAccounts();
  }, []);

  return importedWalletAddress ? (
    <OnboardingCard
      headerText="Import Keyfile"
      subtitle="Upload your private key to recover your account."
      onBackButtonClick={() => navigate(`/auth/recover-account`)}
      isLoading={isViewLoading}>
      <Text>Would you like to recover this account?</Text>
      <Copyable
        isFullWidth
        style={{ padding: 0 }}
        label="Your wallet address"
        onClick={() => {
          copy(importedWalletAddress);
        }}
        value={importedWalletAddress}
      />
      <Row>
        <Button variant="secondary" size="md" onClick={handleTryAgain} isDisabled={areButtonsDisabled}>
          No, try again
        </Button>
        <Button variant="primary" size="md" onClick={handleRecover} isDisabled={areButtonsDisabled}>
          Yes, recover
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Import Keyfile"
      subtitle="Upload your private key to recover your account."
      onBackButtonClick={() => navigate(`/auth/recover-account`)}
      isLoading={isViewLoading}>
      <Upload
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your keyfile"}
        isLoading={isUploading}
        loadingText={"Recovering account..."}
        onFileParse={parseUpload}
      />

      {uploadError && (
        <Text alignment="left" variant="bodySm" style={{ color: "#D22B1F", alignSelf: "flex-start", marginTop: 8 }}>
          {uploadError}
        </Text>
      )}
    </OnboardingCard>
  );
}
