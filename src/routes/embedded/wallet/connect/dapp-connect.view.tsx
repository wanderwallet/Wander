import { Card, Button, Text, Row, Box, Avatar } from "~components/embed/ui";
import type { Wallet } from "~utils/embedded/embedded.types";
import { formatAddress } from "~utils/format";
import { setActiveWallet, useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useEffect, useState } from "react";
import { concatGatewayURL } from "~gateways/utils";
import { useGateway, FULL_HISTORY } from "~gateways/wayfinder";
import { useNameServiceProfile } from "~lib/nameservice";
import { svgie } from "~utils/svgies";
import { ExtensionStorage } from "~utils/storage";
import AppIcons from "./components/AppIcons";

export function EmbeddedConnectAuthRequestView() {
  const { navigate } = useLocation();
  const wallet = useActiveWallet();
  const { authRequest, rejectRequest } = useCurrentAuthRequest("connect");

  const [avatar, setAvatar] = useState("");

  const nameServiceProfile = useNameServiceProfile(wallet?.address);
  const nsGateway = useGateway(FULL_HISTORY);

  useEffect(() => {
    if (!wallet?.address) return;

    if (nameServiceProfile?.logo && nsGateway?.protocol && nsGateway?.host) {
      setAvatar(concatGatewayURL(nsGateway) + "/" + nameServiceProfile.logo);
    } else {
      setAvatar(svgie(wallet?.address, { asDataURI: true }));
    }
  }, [wallet, nameServiceProfile, nsGateway]);

  const { appInfo = {}, url = "" } = authRequest;

  const handleClick = async (wallet: Wallet) => {
    return await setActiveWallet(wallet.address);
  };

  return (
    <Card
      size="auto"
      style={{ paddingTop: "32px" }}
      hasCloseButton={false}
      hasBackButton={false}
    >
      <AppIcons appInfo={appInfo} />
      <Box>
        <Text variant="headingMd">
          {appInfo.name} would like to connect to your wallet
        </Text>
      </Box>
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
              <Box isAutoWidth alignment="left" style={{ padding: 0 }}>
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
      </Box>
      <Box alignment="left" style={{ paddingTop: 0 }}>
        <Button
          variant="primary"
          isFullWidth
          onClick={() => {
            ExtensionStorage.remove(`requested_permissions_${url}`);
            ExtensionStorage.remove("sign_policy");
            navigate("/wallet/settings");
          }}
        >
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
            navigate("/wallet");
            rejectRequest();
          }}
        >
          Cancel
        </Button>
      </Box>
    </Card>
  );
}
