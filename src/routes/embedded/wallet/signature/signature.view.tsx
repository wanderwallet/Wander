import { Card, Button, Text, Box, XClose } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useEffect } from "react";
import browser from "webextension-polyfill";
import Message from "~components/embed/auth/Message";

export function EmbeddedSignatureAuthRequestView() {
  const { navigate } = useLocation();
  const { authRequest, rejectRequest, acceptRequest } =
    useCurrentAuthRequest("signature");

  const { url, authID, message } = authRequest;

  const handleDecrypt = () => {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null
    });
    navigate("/wallet");
    acceptRequest();
  };

  const handleCancel = () => {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null
    });
    navigate("/wallet");
    rejectRequest();
  };

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await acceptRequest();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [authID]);

  return (
    <>
      <Card
        headerText={browser.i18n.getMessage("titles_signature")}
        size="auto"
        style={{
          paddingTop: "24px",
          paddingInline: "16px",
          paddingBottom: "24px"
        }}
        hasCloseButton={true}
        hasBackButton={false}
        customIcon={<XClose fontSize={24} color={"#666666"} />}
        onCloseButtonClick={handleCancel}
      >
        <Box>
          <Text variant="bodyMd" style={{ color: "#666666" }}>
            {browser.i18n.getMessage("signature_description", url)}
          </Text>

          <Message message={message} />
        </Box>

        <Box alignment="left" style={{ paddingTop: 0 }}>
          <Button variant="primary" isFullWidth onClick={handleDecrypt}>
            {browser.i18n.getMessage("signature_authorize")}
          </Button>
          <Button variant="secondary" isFullWidth onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </Card>
    </>
  );
}
