import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Upload, Button, Copyable, Row, Text } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";
import copy from "copy-to-clipboard";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";

export type AuthRestoreFileViewVariant = "recovery-file" | "keyfile";

export interface AuthRestoreSharesKeyfileEmbeddedViewProps extends CommonRouteProps {
  variant?: AuthRestoreFileViewVariant;
}

export function AuthRestoreSharesKeyfileEmbeddedView({
  variant = "keyfile",
}: AuthRestoreSharesKeyfileEmbeddedViewProps) {
  const { navigate } = useLocation();
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const [recoveryFileLoaded, setRecoveryFileLoaded] = useState(false);

  const fileTypeLabel = variant === "keyfile" ? "private key" : "recovery file";

  const handleJsonParse = async (jsonData: any) => {
    try {
      setJsonData(jsonData);

      if (WalletUtils.isRecoveryJSON(jsonData)) {
        setRecoveryFileLoaded(true);
        return;
      } else {
        setRecoveryFileLoaded(false);
      }

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
    recoverWallet,
    wallets,
  } = useEmbedded();

  const handleRecoverWallet = useCallback(async () => {
    try {
      if (WalletUtils.isJWK(jsonData)) {
        const isWalletPresent = wallets.some(({ address }) => address === importedTempWalletAddress);

        if (!isWalletPresent) {
          toast.error("This wallet is not part of your account.");

          return;
        }
      } else if (WalletUtils.isRecoveryJSON(jsonData)) {
        const isWalletPresent = wallets.some(({ id }) => jsonData.walletId === id);

        if (!isWalletPresent) {
          toast.error("This wallet is not part of your account.");

          return;
        }
      } else {
        toast.error("Invalid file.");

        return;
      }

      setLoading(true);

      await recoverWallet(jsonData);
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error happened.");
    } finally {
      setLoading(false);
    }
  }, [recoverWallet, jsonData, wallets, importedTempWalletAddress]);

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle="Confirm your wallet to restore it."
      onBackButtonClick={() => navigate("/auth/restore-shares")}
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
        <Button variant="primary" size="md" onClick={handleRecoverWallet} isDisabled={loading}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Restore wallet"
      subtitle={ `Upload your ${ fileTypeLabel } to restore your wallet.` }
      onBackButtonClick={() => navigate("/auth/restore-shares")}
      isLoading={ loading }>

      <Upload
        isFullWidth
        title={"Click to upload"}
        description={ `or drag and drop your ${ fileTypeLabel }` }
        isLoading={loading}
        loadingText={"Restoring wallet..."}
        onFileParse={handleJsonParse}
      />

      { recoveryFileLoaded ? (
        <Button isFullWidth size="md" isDisabled={loading} onClick={handleRecoverWallet}>
          Restore
        </Button>
      ) : null }

      {fileError && (
        <Text alignment="left" variant="bodySm" style={{ color: "#D22B1F", alignSelf: "flex-start", marginTop: 8 }}>
          Error: incorrect file format
        </Text>
      )}

    </OnboardingCard>
  );
}
