import { QrCodeScanEmbeddedView } from "../../import-qrcode/components/QrCodeEmbeddedView";

export function AuthRecoverAccountQrCodeEmbeddedView() {
  return (
    <QrCodeScanEmbeddedView
      headerText="Scan QR Code"
      subtitle="Scan your wallet QR code to recover your account."
      backButtonClickHref="/auth/recover-account"
      type="recoverAccount"
    />
  );
}
