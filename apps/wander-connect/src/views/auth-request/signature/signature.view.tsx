import browser from "webextension-polyfill";
import { useCurrentAuthRequest } from "@wanderapp/core";
import { Text, Message, AuthRequestCard } from "@wanderapp/ui";

export function EmbeddedSignatureAuthRequestView() {
  const { authRequest, rejectRequest, acceptRequest } = useCurrentAuthRequest("signature");
  const { url, message } = authRequest;

  return (
    <AuthRequestCard
      headerText={browser.i18n.getMessage("titles_signature")}
      onCancel={() => rejectRequest()}
      onConfirm={() => acceptRequest()}
      confirmLabel={browser.i18n.getMessage("signature_authorize")}>
      <Text variant="bodyMd" style={{ color: "#666666" }}>
        {browser.i18n.getMessage("signature_description", url)}
      </Text>

      <Message message={message} />
    </AuthRequestCard>
  );
}
