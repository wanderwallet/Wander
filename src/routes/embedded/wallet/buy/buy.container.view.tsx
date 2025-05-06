import { useMemo } from "react";
import { Card, Button, Text, BuyWithCashIcon, BuyWithCryptoIcon, Row, Box } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletBuyEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Buy Tokens"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}>
      <Box hasBorder style={{ marginTop: "16px" }}>
        <Button variant="link" onClick={() => navigate("/wallet/buy/cash")}>
          <Text variant="bodyMd" style={{ color: "#121212", marginRight: "8px" }}>
            Cash
          </Text>
          <BuyWithCashIcon />
        </Button>
      </Box>

      <Box hasBorder style={{ marginTop: "16px" }}>
        <Button variant="link" onClick={() => navigate("/wallet/receive")}>
          <Text variant="bodyMd" style={{ color: "#121212", marginTop: "8px", marginBottom: "8px" }}>
            Receive from another wallet
          </Text>
        </Button>
      </Box>

      <Box hasBorder style={{ marginTop: "16px" }}>
        <Button variant="link" onClick={() => navigate("/wallet/buy/crypto")}>
          <Text variant="bodyMd" style={{ color: "#121212", marginRight: "8px" }}>
            Crypto
          </Text>
          <BuyWithCryptoIcon />
        </Button>
      </Box>
    </Card>
  );
}
