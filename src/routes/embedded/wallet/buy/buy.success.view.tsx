import { Card, Text, Box, SuccessCheckIcon } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletBuyCashEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <Card
      size="auto"
      headerText="Buy Tokens"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}
    >
      <SuccessCheckIcon />

      <Box hasBorder style={{ marginTop: "16px" }}>
        <Text variant="bodyLg" style={{ color: "#121212" }}>
          Congrats!
        </Text>
        <br />
        <Text alignment="center" variant="bodyMd" style={{ color: "#666666" }}>
          Your purchase is in progress. This may take up to 30-60 minutes to
          complete.
        </Text>
      </Box>
    </Card>
  );
}
