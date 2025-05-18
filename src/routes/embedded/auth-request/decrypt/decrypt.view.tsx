import { Text } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useEffect } from "react";
import browser from "webextension-polyfill";
import Message from "~components/embed/auth/Message";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function EmbeddedDecryptAuthRequestView() {
  const { authRequest, rejectRequest, acceptRequest } = useCurrentAuthRequest("decrypt");
  const { url, message } = authRequest;

  return (
    <AuthRequestCard
      headerText={browser.i18n.getMessage("titles_decrypt")}
      onCancel={rejectRequest}
      onConfirm={acceptRequest}
      confirmLabel={browser.i18n.getMessage("decrypt_authorize")}>

      <Text variant="bodyMd" style={{ color: "#666666" }}>
        {browser.i18n.getMessage("decrypt_description", url)}
      </Text>

      <Message message={message} />

    </AuthRequestCard>
  );
}
