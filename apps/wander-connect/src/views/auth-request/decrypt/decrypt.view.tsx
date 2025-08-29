import { useCurrentAuthRequest } from "@wanderapp/core";
import { Text, AuthRequestCard, Message } from "@wanderapp/ui";
import browser from "webextension-polyfill";

export function EmbeddedDecryptAuthRequestView() {
  const { authRequest, rejectRequest, acceptRequest } = useCurrentAuthRequest("decrypt");
  const { url, message } = authRequest;

  return (
    <AuthRequestCard
      headerText={browser.i18n.getMessage("titles_decrypt")}
      onCancel={() => rejectRequest()}
      onConfirm={() => acceptRequest()}
      confirmLabel={browser.i18n.getMessage("decrypt_authorize")}>
      <Text variant="bodyMd" style={{ color: "#666666" }}>
        {browser.i18n.getMessage("decrypt_description", url)}
      </Text>

      <Message message={message} />
    </AuthRequestCard>
  );
}
