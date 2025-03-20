import {
  Card,
  Button,
  Text,
  Row,
  Box,
  ChevronRight
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletBuyCashEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Buy Tokens"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}
    >
      <Box hasBorder style={{ marginTop: "16px" }}>
        <Row alignment="left">
          <Text variant="bodyMd" style={{ color: "#666666" }}>
            Currency
          </Text>
        </Row>
      </Box>

      <Box hasBorder style={{ marginTop: "16px" }}>
        <Row alignment="between">
          <Button variant="link" onClick={() => navigate("/wallet/receive")}>
            <Text variant="bodyMd" style={{ color: "#666666" }}>
              Payment
            </Text>
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              Credit or Debit Card
            </Text>
            <ChevronRight fontSize={24} color={"#121212"} />
          </Button>
        </Row>
      </Box>

      <Button variant="primary" onClick={() => navigate("/wallet/buy/crypto")}>
        Enter an amount
      </Button>
    </Card>
  );
}
