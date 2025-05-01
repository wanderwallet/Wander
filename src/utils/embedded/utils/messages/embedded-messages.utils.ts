import type { AuthProviderType, SupabaseUser } from "embed-api";
import { nanoid } from "nanoid";
import { AUTH_PROVIDER_TYPE_BY_PROVIDER_STR } from "~utils/embedded/embedded.constants";
import {
  isInsideIframe,
  getEmbeddedAncestorOrigin
} from "~utils/embedded/iframe.utils";
import type {
  EmbeddedCall,
  EmbeddedMessageId,
  EmbeddedMessageMap,
  EmbeddedUserDetails
} from "~utils/embedded/utils/messages/embedded-messages.types";

const EMBEDDED_MESSAGE_IDS = [
  "embedded_auth",
  "embedded_connect",
  "embedded_disconnect",
  "embedded_open",
  "embedded_close",
  "embedded_resize",
  "embedded_balance",
  "embedded_request"
] as const satisfies EmbeddedMessageId[];

export interface PostEmbeddedMessageData<K extends EmbeddedMessageId> {
  type: K;
  data: EmbeddedMessageMap[K];
}

export function postEmbeddedMessage<K extends EmbeddedMessageId>({
  type,
  data
}: PostEmbeddedMessageData<K>) {
  if (!EMBEDDED_MESSAGE_IDS.includes(type))
    throw new Error(
      `Only the following message types are allowed: ${EMBEDDED_MESSAGE_IDS.join(
        ", "
      )}.`
    );

  if (window.parent === null) {
    throw new Error("Unexpected `null` parent Window.");
  }

  const call: EmbeddedCall<K> = {
    id: nanoid(),
    type,
    data
  };

  if (!isInsideIframe()) {
    console.warn(
      "Wander Embedded running as a standalone page. There's no parent Window to send this to =",
      call
    );

    return;
  }

  window.parent.postMessage(call, getEmbeddedAncestorOrigin());
}

export function getUserDetailsFromSupabaseUser(
  user: SupabaseUser
): EmbeddedUserDetails {
  console.log("getUserDetailsFromSupabaseUser", user);

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    updated_at: user.updated_at,
    created_at: user.created_at
  };
}

export function getAuthProviderTypeFromSupabaseUser(
  user: SupabaseUser
): AuthProviderType | null {
  return (
    AUTH_PROVIDER_TYPE_BY_PROVIDER_STR[user?.identities?.[0]?.provider] || null
  );
}
