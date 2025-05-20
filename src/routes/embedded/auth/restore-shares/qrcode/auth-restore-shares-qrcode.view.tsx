import { QrCodeScanEmbeddedView } from "../../import-qrcode/components/QrCodeEmbeddedView";

export function AuthRestoreSharesQrCodeEmbeddedView() {
  return (
    <QrCodeScanEmbeddedView
      headerText="Restore wallet"
      subtitle="Scan your wallet QR code to restore your wallet."
      backButtonClickHref="/auth/restore-shares"
      type="restoreWallet"
    />
  );
}
