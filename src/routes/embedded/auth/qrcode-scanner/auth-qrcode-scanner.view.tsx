import { useCallback } from "react";
import { Card, WanderFooter } from "~components/embed";
import { useLocation } from "~wallets/router/router.utils";
import { CameraView } from "./camera-view";

export function AuthQRCodeScannerEmbeddedView() {
  const { back } = useLocation();

  const handleReadQRCode = useCallback(async () => {}, []);

  return (
    <Card
      headerText="Scan QR Code"
      subtitle="Scan you wallet QR code to import your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="sm"
    >
      <CameraView />
    </Card>
  );
}
