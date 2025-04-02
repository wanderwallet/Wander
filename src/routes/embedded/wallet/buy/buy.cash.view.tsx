import { useState } from "react";
import {
  Card,
  Button,
  Text,
  Row,
  Box,
  ChevronRight,
  Input
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletBuyCashEmbeddedView() {
  const { navigate } = useLocation();
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");

  const handlePurchaseChange = (value: string) => {
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setPurchaseAmount(value);
    }
  };
  return (
    <Card
      size="auto"
      headerText="Buy Tokens"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}
    >
      <Input
        value={purchaseAmount}
        onChange={(e) => handlePurchaseChange(e.target.value)}
        placeholder="0.00"
        isCentered={true}
        autoSize={true}
        style={{
          fontSize: "32px",
          fontWeight: "500",
          color: "#121212",
          border: "none",
          padding: "8px 0",
          background: "transparent"
        }}
      />
      <Text variant="bodyLg" style={{ fontWeight: "500" }}>
        PL
      </Text>
      <Text variant="bodySm" style={{ color: "#666666", marginTop: "4px" }}>
        ${purchaseAmount ? Number(purchaseAmount).toFixed(2) : "0.00"} USD
      </Text>
      <Box hasBorder style={{ marginTop: "16px" }}>
        <Row justifyContent="between">
          <Text variant="bodyMd" style={{ color: "#666666" }}>
            Currency
          </Text>
          <Row justifyContent="end">
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              USD
            </Text>
            <ChevronRight fontSize={24} color={"#121212"} />
          </Row>
        </Row>
      </Box>
      {/* <Button variant="link" onClick={() => navigate("/wallet/receive")}> */}
      <Box hasBorder style={{ marginTop: "16px" }}>
        <Row justifyContent="between">
          <Text variant="bodyMd" style={{ color: "#666666" }}>
            Payment
          </Text>
          <Row justifyContent="end">
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              Credit or Debit Card
            </Text>
            <ChevronRight fontSize={24} color={"#121212"} />
          </Row>
        </Row>
      </Box>
      {/* </Button> */}
      <Button
        variant="primary"
        onClick={() => navigate("/wallet/buy/success")}
        isDisabled={!purchaseAmount}
      >
        {purchaseAmount ? "Next" : "Enter an amount"}
      </Button>
    </Card>
  );
}
