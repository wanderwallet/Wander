import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";
import "./receive.view.css";
import { Card, Text, Copyable, Box } from "~components/embed/ui";
import { useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import copy from "copy-to-clipboard";

export function WalletReceiveEmbeddedView() {
  const { currentWallet } = useEmbedded();
  const { navigate } = useLocation();

  const effectiveAddress = useMemo(() => currentWallet.address, [currentWallet]);

  return (
    <Card
      size="auto"
      headerText="Receive"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}>
      <Box>
        {/* <Text
          variant="bodyLg"
          style={{
            margin: "1rem",
            fontWeight: "bold",
            color: "var(--color-text-primary)"
          }}
        >
          {effectiveWalletName}
        </Text> */}
        <div className="wrapper">
          <QRCodeSVG fgColor="#FFFFFF" bgColor="#0D6CE9" size={224} value={effectiveAddress ?? ""} />
        </div>
        <Copyable
          isFullWidth
          value={effectiveAddress ?? ""}
          hasBorder={false}
          style={{
            marginTop: "1rem",
            backgroundColor: "#EBEBF0",
            borderRadius: "8px",
            color: "#666666",
          }}
          onClick={() => {
            copy(effectiveAddress ?? "");
          }}
        />
      </Box>
    </Card>
  );
}
