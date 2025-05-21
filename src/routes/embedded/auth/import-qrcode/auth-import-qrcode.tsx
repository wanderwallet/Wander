import { QrCodeScanEmbeddedView } from "./components/QrCodeEmbeddedView";

export function AuthImportQrCodeEmbeddedView() {
  return (
    <QrCodeScanEmbeddedView
      headerText="Import wallet"
      subtitle="Scan your wallet QR code to import your account."
      backButtonClickHref="/auth/add-wallet"
      type="importWallet"
    />
  );
}
