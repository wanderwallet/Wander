import { Card, Button, Text, BuyWithCashIcon, Box, WanderFooter } from "~components/embed/ui";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";

export function WalletReceiveOptionsEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Receive Tokens"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}>
      <Box hasBorder style={{ marginTop: "16px" }}>
        <Link
          to="/wallet/buy/cash"
          style={{
            textDecoration: "none",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
          }}>
          <Text variant="bodyMd" style={{ color: "#121212", marginRight: "8px" }}>
            Cash
          </Text>
          <BuyWithCashIcon />
        </Link>
      </Box>

      <Box hasBorder style={{ marginBottom: "32px", marginTop: "16px", padding: "16px" }}>
        <Link to="/wallet/deposit" style={{ textDecoration: "none", width: "100%" }}>
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            Receive from another wallet
          </Text>
        </Link>
      </Box>
    </Card>
  );
}
