import { useCallback, useState } from "react";
import { Box, Button, CameraIcon, Card, WanderFooter } from "~components/embed";
import { useLocation } from "~wallets/router/router.utils";
import { useWebcamPermission } from "./hooks/useWebcamPermission";

export function AuthAddWithQRCodeEmbeddedView() {
  const [showScanner, setShowScanner] = useState(false);

  const { navigate, back } = useLocation();
  const { permissionStatus, isLoading, error, requestPermission } =
    useWebcamPermission();

  const handleOpenWebcam = useCallback(async () => {
    // const permissionGranted = await requestPermission();

    if (true) {
      setShowScanner(true);
      navigate("/auth/qrcode-scanner");
    } else {
      // Could show an error message to the user here
      // For example, using an alert or a toast notification
    }
  }, [navigate, requestPermission, error]);

  return (
    <Card
      headerText="Scan QR Code"
      subtitle="Scan your wallet QR code to import your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="sm"
    >
      <Box>
        <Button
          variant="secondary"
          isFullWidth
          icon={<CameraIcon />}
          onClick={handleOpenWebcam}
        >
          Open webcam
        </Button>
      </Box>
    </Card>
  );
}
