import { useMemo } from "react";
import { Card, Row, Text, Box, Button } from "~components/embed/ui";
import { useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";

export function WalletTransactionsHistoryEmbeddedView() {
  const wallet = useActiveWallet();
  const { back } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Transaction History"
      hasBackButton={true}
      onBackButtonClick={back}
      style={{ padding: "2rem" }}
    >
      <Box hasBorder style={{ margin: "1rem" }}>
        <Row isFullWidth justifyContent="between">
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            Created a Repo
          </Text>
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            -2.0010
          </Text>
        </Row>
        <Row isFullWidth justifyContent="between">
          <Text variant="bodySm">January 3</Text>
          <Text variant="bodySm">Balance: 5.9980</Text>
        </Row>
      </Box>
      <Button variant="link" href="#/wallet/transactions-history">
        View all transactions
      </Button>
    </Card>
  );
}
