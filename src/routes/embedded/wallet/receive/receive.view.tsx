import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";
import {
  Card,
  Divider,
  AccountSelector,
  Row,
  CoinsIcon,
  Text,
  ReceiptIcon,
  OpenTabIcon,
  Box,
  Link,
  Copyable
} from "~components/embed/ui";
import { QRCodeWrapper } from "~routes/popup/receive";
import { useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";

export function WalletReceiveEmbeddedView() {
  const wallet = useActiveWallet();
  const { back } = useLocation();

  const effectiveAddress = useMemo(() => wallet?.address, [wallet]);

  const effectiveWalletName = useMemo(() => wallet?.nickname, [wallet]);

  return (
    <Card
      size="auto"
      headerText="Receive"
      hasBackButton={true}
      onBackButtonClick={back}
      style={{ padding: "32px" }}
    >
      <Text variant="bodyMd" style={{ margin: "1rem" }}>
        {effectiveWalletName}
      </Text>
      <QRCodeWrapper>
        <QRCodeSVG
          fgColor="#fff"
          bgColor="transparent"
          size={224}
          value={effectiveAddress ?? ""}
        />
      </QRCodeWrapper>
      <Copyable value={effectiveAddress ?? ""} hasBorder={false} />
    </Card>
  );
}
