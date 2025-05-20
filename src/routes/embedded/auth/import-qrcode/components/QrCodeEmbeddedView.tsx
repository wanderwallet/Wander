import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { Row, Copyable, Button, CameraIcon, Box, QRLoopScanner } from "~components/embed";
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useWebcamPermission } from "../hooks/useWebcamPermission";
import { Link } from "~routes/popup/token/[id]";
import type { JWKInterface } from "@dha-team/arbundles";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export interface QrCodeScanEmbeddedViewProps {
  headerText: string;
  subtitle: string;
  backButtonClickHref: WanderRoutePath;
  type: "importWallet" | "restoreWallet" | "recoverAccount";
}

export function QrCodeScanEmbeddedView({
  headerText,
  subtitle,
  backButtonClickHref,
  type,
}: QrCodeScanEmbeddedViewProps) {
  const { navigate } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [jwkData, setJwkData] = useState<JWKInterface | null>(null);

  const {
    importTempWallet,
    deleteImportedTempWallet,
    registerWallet,
    recoverWallet,
    importedTempWalletAddress,
    fetchRecoverableAccounts,
    fetchRecoverableAccountWallets,
    clearRecoverableAccounts,
  } = useEmbedded();
  const { isLoading: isWebcamLoading, requestPermission, permissionStatus } = useWebcamPermission();

  const areButtonsDisabled = isLoading;
  const isViewLoading = isLoading;

  const handleOpenWebcam = useCallback(async () => {
    try {
      const permissionGranted = await requestPermission();

      if (!permissionGranted) {
        toast.error("Permission denied");
      }
    } catch (error) {
      toast.error(error);
    }
  }, [navigate, requestPermission]);

  const handleConfirm = async () => {
    try {
      if (areButtonsDisabled) return;

      if (!WalletUtils.isJWK(jwkData)) {
        toast.error("Invalid QR code.");

        return;
      }

      setIsLoading(true);

      if (type === "importWallet") {
        await registerWallet("IMPORTED");
      } else if (type === "restoreWallet") {
        await recoverWallet(jwkData);
      } else {
        const recoverableAccounts = await fetchRecoverableAccounts();

        if (recoverableAccounts.length === 1) {
          await fetchRecoverableAccountWallets(recoverableAccounts[0]);
          navigate(EmbeddedPaths.Auth);
        } else if (recoverableAccounts.length > 1) {
          navigate("/auth/recover-account/select");
        } else {
          toast.error("No recoverable accounts found");
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage = `Unexpected error while ${type === "importWallet" ? "importing" : type === "restoreWallet" ? "restoring" : "recovering"} ${type !== "recoverAccount" ? "wallet" : "account"}.`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanResult = async (result: JWKInterface) => {
    try {
      if (!WalletUtils.isJWK(result)) {
        throw new Error("Invalid QR code.");
      }

      setJwkData(result);
      await importTempWallet(result);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleTryAgain = () => {
    deleteImportedTempWallet();
  };

  useEffect(() => {
    if (type === "recoverAccount") {
      deleteImportedTempWallet();
      clearRecoverableAccounts();
    }

    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      if (type !== "recoverAccount") {
        deleteImportedTempWallet();
      }
    };
  }, [type]);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText={headerText}
      subtitle={subtitle}
      onBackButtonClick={() => navigate(backButtonClickHref)}
      isLoading={isViewLoading}>
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
        <Button variant="secondary" size="md" onClick={handleTryAgain} isDisabled={areButtonsDisabled}>
          No, try again
        </Button>
        <Button variant="primary" size="md" onClick={handleConfirm} isDisabled={areButtonsDisabled}>
          Yes, {type === "importWallet" ? "add" : type === "restoreWallet" ? "restore" : "recover"}
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText={headerText}
      subtitle={subtitle}
      onBackButtonClick={() => navigate(backButtonClickHref)}
      isLoading={isViewLoading}>
      {permissionStatus === "granted" ? (
        <>
          <QRLoopScanner onResult={handleScanResult} />
          <Link style={{ color: "#0D6CE9", fontSize: 14, fontWeight: 600, letterSpacing: 0.2 }} href="" target="_blank">
            Where do I find my QR code?
          </Link>
        </>
      ) : (
        <Box style={{ padding: "4rem 0px" }}>
          <Button
            variant="secondary"
            isFullWidth
            icon={<CameraIcon />}
            onClick={handleOpenWebcam}
            isLoading={isWebcamLoading}>
            Open webcam
          </Button>
        </Box>
      )}
    </OnboardingCard>
  );
}
