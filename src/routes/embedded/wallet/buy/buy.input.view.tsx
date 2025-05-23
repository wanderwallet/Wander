import { Card, Button, Text, Input, Row, Box, ChevronRight } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useState } from "react";

export function WalletBuyInputEmbeddedView() {
  const { navigate } = useLocation();
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");

  const handlePurchaseChange = (value: string) => {
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setPurchaseAmount(value);
    }
  };

  const handlePayChange = (value: string) => {
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setPayAmount(value);
    }
  };

  const handleConnectWallet = () => {
    // Navigate to wallet connection screen
    // navigate("/wallet/connect");
  };

  const handleEnterAmount = () => {
    // Navigate to next step in purchase flow
    // navigate("/wallet/buy/confirm");
  };

  return (
    <Card
      size="auto"
      headerText="Buy Tokens"
      hasBackButton={true}
      hasCloseButton={true}
      onBackButtonClick={() => navigate("/wallet/buy")}
      onCloseButtonClick={() => navigate("/wallet")}
      style={{ padding: "24px" }}>
      <Box alignment="left" style={{ marginBottom: "24px" }}>
        <Text variant="bodyMd" style={{ color: "#666666", marginBottom: "8px" }}>
          Purchase
        </Text>
        <Row justifyContent="between" alignment="center">
          <Input
            value={purchaseAmount}
            onChange={(e) => handlePurchaseChange(e.target.value)}
            placeholder="0.00"
            style={{
              fontSize: "32px",
              fontWeight: "500",
              color: "#121212",
              border: "none",
              padding: "0",
              width: "70%",
            }}
          />
          <Row alignment="center" style={{ gap: "4px" }}>
            <Text variant="bodyLg" style={{ fontWeight: "500" }}>
              PL
            </Text>
            <Box
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "#0D6CE9",
              }}
            />
          </Row>
        </Row>
        <Text variant="bodySm" style={{ color: "#666666", marginTop: "4px" }}>
          ${purchaseAmount ? Number(purchaseAmount).toFixed(2) : "0.00"} USD
        </Text>
      </Box>

      <Box alignment="left" style={{ marginBottom: "24px" }}>
        <Text variant="bodyMd" style={{ color: "#666666", marginBottom: "8px" }}>
          Pay with
        </Text>
        <Row justifyContent="between" alignment="center">
          <Input
            value={payAmount}
            onChange={(e) => handlePayChange(e.target.value)}
            placeholder="0.00"
            style={{
              fontSize: "32px",
              fontWeight: "500",
              color: "#121212",
              border: "none",
              padding: "0",
              width: "70%",
            }}
          />
          <Box
            hasBorder
            style={{
              padding: "4px 8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
            <Text variant="bodyMd">USDA</Text>
            <Box
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "#008864",
              }}
            />
            <ChevronRight fontSize={16} color={"#121212"} />
          </Box>
        </Row>
        <Button
          variant="link"
          style={{ padding: "0", color: "#0D6CE9", marginTop: "8px" }}
          onClick={handleConnectWallet}>
          Connect wallet
        </Button>
      </Box>

      <Button variant="primary" isFullWidth onClick={handleEnterAmount} isDisabled={!purchaseAmount || !payAmount}>
        Enter an amount
      </Button>
    </Card>
  );
}
