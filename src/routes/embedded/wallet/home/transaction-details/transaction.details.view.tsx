import { Card, Row, Text, Box, Button } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletTransactionDetailsEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Transaction details"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "2rem" }}
    >
      <br />
      <Row isFullWidth justifyContent="between">
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Transaction ID
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          22VJE3ipVuDK
        </Text>
      </Row>
      <br />
      <Row isFullWidth justifyContent="between">
        <Text variant="bodySm" style={{ color: "#666666" }}>
          From
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          Main (Bozj...x_ZM)
        </Text>
      </Row>
      <br />
      <Row isFullWidth justifyContent="between">
        <Text variant="bodySm" style={{ color: "#666666" }}>
          To
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          DndQNzvU5WsmoA0rfnEh
        </Text>
      </Row>
      <br />
      <Row isFullWidth justifyContent="between">
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Network Fee
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          0.0000
        </Text>
      </Row>
      <br />
      <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Message
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
          varius enim in eros elementum tristique. Duis cursus, mi quis viverra
          ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
        </Text>
      </Box>
    </Card>
  );
}
