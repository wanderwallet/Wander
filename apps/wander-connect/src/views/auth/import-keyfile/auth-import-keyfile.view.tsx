import { useEffect, useState } from "react";
import { Row, Upload, Copyable, Button, OnboardingCard, Snackbar } from "@wanderapp/ui";
import copy from "copy-to-clipboard";
import { useLocation, useWalletUpload, WalletUtils } from "@wanderapp/core";
import { toast } from "react-toastify";
import { useEmbedded } from "../../../utils/embedded.hooks";

export function AuthImportKeyfileEmbeddedView() {
  const { navigate } = useLocation();
  const { importTempWallet, deleteImportedTempWallet, registerWallet, wallets, authStatus } = useEmbedded();

  // Upload:

  const {
    data: uploadData,
    isLoading: isUploading,
    error: uploadError,
    importedWalletAddress,
    parse: parseUpload,
    reset: resetUpload,
  } = useWalletUpload({
    wallets,
    importTempWallet,
    allowRecoveryFile: false,
    mustWalletExist: false,
  });

  // Loading state:

  const [isAdding, setIsAdding] = useState(false);

  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAdding;

  const areButtonsDisabled = isViewLoading || isUploading;

  const handleAddWallet = async () => {
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

      setIsAdding(true);

      await registerWallet("IMPORTED");
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error while importing wallet.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleTryAgain = () => {
    resetUpload();
    deleteImportedTempWallet();
  };

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedWalletAddress ? (
    <OnboardingCard
      headerText={authStatus === "noWallets" ? "Import Keyfile" : "Restore Wallet"}
      subtitle="Would you like to add this wallet to your account?"
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={isViewLoading}>
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
        <Button variant="primary" size="md" onClick={handleAddWallet} isDisabled={areButtonsDisabled}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText={authStatus === "noWallets" ? "Import Keyfile" : "Restore Wallet"}
      subtitle="Upload your private key to add your wallet to your account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
      isLoading={isViewLoading}>
      <Upload
        isFullWidth
        fileLabel="your keyfile"
        isLoading={isUploading}
        loadingText={"Recovering account..."}
        onFileParse={parseUpload}
      />

      <Snackbar variant="error">{uploadError}</Snackbar>
    </OnboardingCard>
  );
}
