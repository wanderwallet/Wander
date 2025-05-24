import { Card } from "~components/embed";
import { useLocation } from "~wallets/router/router.utils";
import { QrReader } from "~components/embed/ui/organisms";
import { WanderFooter } from "~components/embed/ui/templates/wander-footer/WanderFooter";

export function AuthQRCodeScannerEmbeddedView() {
  const { back } = useLocation();

  return (
    <Card
      headerText="Scan QR Code"
      subtitle="Scan you wallet QR code to import your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="sm">
      <QrReader />
    </Card>
  );
}
