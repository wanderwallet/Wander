import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Upload, Button, Copyable, Row, Text } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import copy from "copy-to-clipboard";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useWalletUpload } from "~utils/upload/wallet/use-wallet-upload.hook";

export type AuthRestoreFileViewVariant = "recovery-file" | "keyfile";

export interface AuthRestoreSharesKeyfileEmbeddedViewProps extends CommonRouteProps {
  variant?: AuthRestoreFileViewVariant;
}

export function AuthRestoreSharesKeyfileEmbeddedView({
  variant = "keyfile",
}: AuthRestoreSharesKeyfileEmbeddedViewProps) {
  const { navigate } = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);

  const {
    importTempWallet,
    deleteImportedTempWallet,
    recoverWallet,
    wallets,
  } = useEmbedded();

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
    allowRecoveryFile: true,
    mustWalletExist: true,
  });

  const areButtonsDisabled = isRecovering || isUploading;
  const isViewLoading = isRecovering;

  const handleRecoverWallet = async () => {
    try {
      if (areButtonsDisabled) return;

      if (uploadError) {
        toast.error(uploadError);

        return;
      }

      if (!WalletUtils.isJWK(uploadData) && !WalletUtils.isRecoveryJSON(uploadData)) {
        toast.error("Invalid file.");

        return;
      }

      setIsRecovering(true);

      await recoverWallet(uploadData);
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error while recovering wallet.");
    } finally {
      setIsRecovering(false);
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

  const fileTypeLabel = variant === "keyfile" ? "private key" : "recovery file";

  return importedWalletAddress ? (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle="Confirm your wallet to restore it."
      onBackButtonClick={() => navigate("/auth/restore-shares")}
      isLoading={ isViewLoading }>
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
        <Button variant="primary" size="md" onClick={handleRecoverWallet} isDisabled={areButtonsDisabled}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle={ `Upload your ${ fileTypeLabel } to restore your wallet.` }
      onBackButtonClick={() => navigate("/auth/restore-shares")}
      isLoading={ isViewLoading }>

      <Upload
        isFullWidth
        title={"Click to upload"}
        description={ `or drag and drop your ${ fileTypeLabel }` }
        isLoading={isUploading}
        loadingText={"Restoring wallet..."}
        onFileParse={parseUpload}
      />

      {uploadError && (
        <Text alignment="left" variant="bodySm" style={{ color: "#D22B1F", alignSelf: "flex-start", marginTop: 8 }}>
          { uploadError }
        </Text>
      )}

    </OnboardingCard>
  );
}
