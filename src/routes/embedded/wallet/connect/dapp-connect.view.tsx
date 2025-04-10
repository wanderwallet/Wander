import { Card, Button, Text, Row, Box, Avatar } from "~components/embed/ui";
import type { Wallet } from "~utils/embedded/embedded.types";
import { setActiveWallet, useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";

export function EmbeddedConnectAuthRequestView() {
  const { navigate } = useLocation();
  const wallet = useActiveWallet();

  const handleClick = async (wallet: Wallet) => {
    return await setActiveWallet(wallet.address);
  };

  const appInfo = {
    name: "Dapp Name" //TODO: get from the auth request
  };

  return (
    <Card
      size="auto"
      headerText={`${appInfo.name} would like to connect to your wallet`}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}
    >
      <Box alignment="left">
        <Text variant="bodyMd">Select an account to connect:</Text>
        <Box
          style={{
            margin: "8px 0 32px 0",
            width: "92%",
            backgroundColor: "#EBEBF0",
            borderRadius: "16px"
          }}
        >
          <Row alignment="between">
            <Row alignment="left">
              <Avatar fontColor="#EBEBF0" backgroundColor="#0D6CE9">
                {wallet.nickname}
              </Avatar>
              <Box isAutoWidth>
                <Text variant="bodyLg" style={{ color: "#121212" }}>
                  {wallet.nickname}
                </Text>
                <Text variant="bodySm">{wallet.address}</Text>
              </Box>
            </Row>

            <Button
              variant="icon"
              alignment="right"
              onClick={() => navigate("/wallet/account-list")}
            >
              <Text
                alignment="right"
                variant="bodySm"
                style={{ color: "#0D6CE9" }}
              >
                Change
              </Text>
            </Button>
          </Row>
        </Box>
        <Button variant="primary" isFullWidth>
          Next
        </Button>
        <Button variant="secondary" isFullWidth>
          Cancel
        </Button>
      </Box>
    </Card>
  );
}
