import {
  Card,
  Row,
  Text,
  Box,
  Button,
  Divider,
  ChevronRight
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletTransactionSignEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Confirm Activity"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "2rem" }}
    >
      <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Your account
        </Text>
        <br />
        <Row isFullWidth justifyContent="between">
          <Text variant="bodyMd" style={{ color: "#666666" }}>
            Balance
          </Text>

          <Text variant="bodyMd" style={{ color: "#121212" }}>
            5.9980
          </Text>
        </Row>
      </Box>
      <Row isFullWidth justifyContent="between">
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Amount
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          0.0000
        </Text>
      </Row>
      <Divider />
      <Row isFullWidth justifyContent="between">
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Total fees
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          0.0000
        </Text>
      </Row>

      <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Message
        </Text>
        <br />
        <Text variant="bodySm" style={{ color: "#121212" }}>
          This transaction is a test transaction.
        </Text>
        <Row isFullWidth justifyContent="between">
          <Text variant="bodySm" style={{ color: "#666666" }}>
            Transaction details
          </Text>
          <Button variant="link" href="/wallet/transaction-details">
            <ChevronRight fontSize={24} color={"#121212"} />
          </Button>
        </Row>
      </Box>
      <Row>
        <Button variant="secondary" href="/wallet/transaction">
          Cancel
        </Button>
        <Button variant="primary" href="/wallet/transaction-details">
          Confirm
        </Button>
      </Row>
    </Card>
  );
}
