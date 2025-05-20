import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";

import { Row, Copyable, Button, CameraIcon, Box, QRLoopScanner } from "~components/embed";
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useWebcamPermission } from "./hooks/useWebcamPermission";
import { Link } from "~routes/popup/token/[id]";
import type { JWKInterface } from "@dha-team/arbundles";

export function AuthImportQrCodeEmbeddedView() {
  const { navigate } = useLocation();
  const [isAdding, setIsAdding] = useState(false);
  const [jwkData, setJwkData] = useState<JWKInterface | null>(null);

  const { importTempWallet, deleteImportedTempWallet, registerWallet, importedTempWalletAddress } = useEmbedded();
  const { isLoading, requestPermission, permissionStatus } = useWebcamPermission();

  const areButtonsDisabled = isAdding;
  const isViewLoading = isAdding;

  const handleOpenWebcam = useCallback(async () => {
    try {
      const permissionGranted = await requestPermission();

      if (permissionGranted) {
        // navigate("/auth/qrcode-scanner");
      } else {
        toast.error("Permission denied");
      }
    } catch (error) {
      toast.error(error);
    }
  }, [navigate, requestPermission]);

  const handleAddWallet = async () => {
    try {
      if (areButtonsDisabled) return;

      if (!WalletUtils.isJWK(jwkData)) {
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

  const handleScanResult = async (result: JWKInterface) => {
    setJwkData(result);
    await importTempWallet(result);
  };

  const handleTryAgain = () => {
    deleteImportedTempWallet();
  };

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedTempWalletAddress ? (
    <OnboardingCard
      headerText="Scan QR Code"
      subtitle="Scan your wallet QR code to import your account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
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
        <Button variant="primary" size="md" onClick={handleAddWallet} isDisabled={areButtonsDisabled}>
          Yes, add
        </Button>
      </Row>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Scan QR Code"
      subtitle="Scan your wallet QR code to import your account."
      onBackButtonClick={() => navigate(`/auth/add-wallet`)}
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
            isLoading={isLoading}>
            Open webcam
          </Button>
        </Box>
      )}
    </OnboardingCard>
  );
}
