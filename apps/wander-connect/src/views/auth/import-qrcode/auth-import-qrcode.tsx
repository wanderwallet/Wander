import { useEmbedded } from "../../../utils/embedded.hooks";
import { QrCodeScanEmbeddedView } from "./components/QrCodeEmbeddedView";

export function AuthImportQrCodeEmbeddedView() {
  const { authStatus } = useEmbedded();

  return (
    <QrCodeScanEmbeddedView
      headerText={authStatus === "noWallets" ? "Import Wallet" : "Restore Wallet"}
      subtitle="Scan your wallet QR code to import your account."
      backButtonClickHref="/auth/add-wallet"
      type="importWallet"
    />
  );
}
