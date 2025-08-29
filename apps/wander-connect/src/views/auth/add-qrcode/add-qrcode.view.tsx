import { useCallback } from "react";
import { Box, Button, CameraIcon, Card, WanderFooter } from "@wanderapp/ui";
import { useLocation } from "@wanderapp/core";
import { toast } from "react-toastify";
import { useWebcamPermission } from "../import-qrcode/hooks/useWebcamPermission";

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
      onBackButtonClick={back}>
      <Box>
        <Button variant="secondary" isFullWidth icon={<CameraIcon />} onClick={handleOpenWebcam} isLoading={isLoading}>
          Open webcam
        </Button>
      </Box>
    </Card>
  );
}
