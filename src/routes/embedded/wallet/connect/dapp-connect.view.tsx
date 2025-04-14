import { Card, Button, Text, Row, Box, Avatar } from "~components/embed/ui";
import type { Wallet } from "~utils/embedded/embedded.types";
import { formatAddress } from "~utils/format";
import { setActiveWallet, useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";

export function EmbeddedConnectAuthRequestView() {
  const { navigate } = useLocation();
  const wallet = useActiveWallet();
  const { authRequest } = useCurrentAuthRequest("connect");

  const handleClick = async (wallet: Wallet) => {
    return await setActiveWallet(wallet.address);
  };

  // Create encoded URL for href navigation
  const settingsUrl = (() => {
    const encodedPayload = encodeURIComponent(JSON.stringify(authRequest));
    return `#/wallet/settings?requestPayload=${encodedPayload}`;
  })();

  return (
    <Card
      size="auto"
      headerText={`${authRequest.appInfo.name} would like to connect to your wallet`}
      style={{ paddingTop: "32px" }}
      hasCloseButton={false}
    >
      <Box alignment="left">
        <Text variant="bodyMd">Select an account to connect:</Text>
        <Box
          alignment="left"
          style={{
            margin: "8px 0 32px 0",
            width: "100%",
            backgroundColor: "#EBEBF0",
            borderRadius: "16px"
          }}
        >
          <Row>
            <Row alignment="center" justifyContent="start">
              <Avatar fontColor="#EBEBF0" backgroundColor="#0D6CE9" size="lg">
                {wallet.nickname}
              </Avatar>
              <Box isAutoWidth alignment="left">
                <Text variant="bodyLg" style={{ color: "#121212" }}>
                  {wallet.nickname}
                </Text>
                <Text variant="bodySm">{formatAddress(wallet.address, 4)}</Text>
              </Box>
            </Row>
            <Button variant="link" style={{ paddingInline: "12px" }}>
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
        <Button variant="primary" isFullWidth href={settingsUrl}>
          Next
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          onClick={() => {
            postEmbeddedMessage({
              type: "embedded_close",
              data: null
            });
          }}
        >
          Cancel
        </Button>
      </Box>
    </Card>
  );
}
