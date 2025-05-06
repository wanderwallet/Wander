import { useCallback, useState } from "react";
import { Box, Button, CameraIcon, Card, WanderFooter } from "~components/embed";
import { useLocation } from "~wallets/router/router.utils";
import { useWebcamPermission } from "./hooks/useWebcamPermission";
import { toast } from "react-toastify";

export function AuthAddWithQRCodeEmbeddedView() {
  const { navigate, back } = useLocation();
  const { isLoading, error, requestPermission } = useWebcamPermission();

  const handleOpenWebcam = useCallback(async () => {
    try {
      const permissionGranted = await requestPermission();

      if (permissionGranted) {
        navigate("/auth/qrcode-scanner");
      } else {
        toast.error("Permission denied");
      }
    } catch (error) {
      toast.error(error);
    }
  }, [navigate, requestPermission]);

  return (
    <Card
      headerText="Scan QR Code"
      subtitle="Scan your wallet QR code to import your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="sm">
      <Box>
        <Button variant="secondary" isFullWidth icon={<CameraIcon />} onClick={handleOpenWebcam} isLoading={isLoading}>
          Open webcam
        </Button>
      </Box>
    </Card>
  );
}
