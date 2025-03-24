import { useMemo, useState } from "react";

import { Button, CameraIcon, Card, WanderFooter } from "~components/embed";
import { useLocation } from "~wallets/router/router.utils";

export function AuthAddWithQRCodeEmbeddedView() {
  const { navigate } = useLocation();
  const [isLoading, setIsLoading] = useState({
    calledId: "",
    status: false
  });

  const isDisabled = useMemo(
    () => isLoading.status === true,
    [isLoading.status]
  );

  const handleOpenWebcam = () => {
    // implement a request for the camera permission
    // open the camera
    // scan the QR code
    // navigate to the next page
    // handle the QR code data
  };

  return (
    <Card
      headerText="Scan QR Code"
      subtitle="Scan your wallet QR code to import your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate(`/account`)}
      size="auto"
    >
      <Button
        variant="secondary"
        isFullWidth
        icon={<CameraIcon />}
        isDisabled={isDisabled}
      >
        Open webcam
      </Button>
    </Card>
  );
}
