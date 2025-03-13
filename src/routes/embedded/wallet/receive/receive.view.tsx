import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";
import "./receive.view.css";
import { Card, Text, Copyable } from "~components/embed/ui";
import { useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";

export function WalletReceiveEmbeddedView() {
  const wallet = useActiveWallet();
  const { navigate, back } = useLocation();

  const effectiveAddress = useMemo(() => wallet?.address, [wallet]);

  const effectiveWalletName = useMemo(() => wallet?.nickname, [wallet]);

  return (
    <Card
      size="auto"
      headerText="Receive"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}
    >
      <Text variant="bodyMd" style={{ margin: "1rem" }}>
        {effectiveWalletName}
      </Text>
      <div className="wrapper">
        <QRCodeSVG
          fgColor="#503ece"
          bgColor="transparent"
          size={224}
          value={effectiveAddress ?? ""}
        />
      </div>
      <Copyable value={effectiveAddress ?? ""} hasBorder={false} />
    </Card>
  );
}
