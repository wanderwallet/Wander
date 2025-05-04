import type { AuthProviderType, SupabaseUser } from "embed-api";
import { nanoid } from "nanoid";
import { AUTH_PROVIDER_TYPE_BY_PROVIDER_STR } from "~utils/embedded/embedded.constants";
import {
  isInsideIframe,
  getEmbeddedAncestorOrigin
} from "~utils/embedded/iframe.utils";
import type {
  EmbeddedAuthMessageData,
  EmbeddedCall,
  EmbeddedMessageId,
  EmbeddedMessageMap,
  EmbeddedUserDetails
} from "~utils/embedded/utils/messages/embedded-messages.types";

const EMBEDDED_MESSAGE_IDS = [
  "embedded_auth",
  "embedded_open",
  "embedded_close",
  "embedded_resize",
  "embedded_balance",
  "embedded_request"
] as const satisfies EmbeddedMessageId[];

const messageKeyFnByType: {
  [K in EmbeddedMessageId]: (data: EmbeddedMessageMap[K]) => string | null;
} = {
  embedded_auth: (data) => {
    return [
      data.authType,
      data.authStatus,
      Object.entries(data.userDetails || {})
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map((v) => v[1])
    ].join("|");
  },
  embedded_open: (data) => null,
  embedded_close: (data) => null,
  embedded_resize: (data) => {
    return [
      data.routeType,
      data.preferredLayoutType,
      data.width,
      data.height
    ].join("|");
  },
  embedded_balance: (data) => {
    return [data.amount, data.currency, data.formattedBalance].join("|");
  },
  embedded_request: (data) => {
    return [data.pendingRequests, data.hasNewConnectRequest].join("|");
  }
};

let lastMessageKeyByType: Partial<Record<EmbeddedMessageId, string>> = {};

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

  if (
    type === "embedded_auth" &&
    (data as EmbeddedAuthMessageData).authStatus === "not-authenticated"
  ) {
    lastMessageKeyByType = {};
  }

  const messageKeyFn = messageKeyFnByType[type];
  const messageKey = messageKeyFn(data);

  if (messageKey !== null) {
    const lastMessageKey = lastMessageKeyByType[type];

    if (lastMessageKey === messageKey) {
      // For message types that have a function defined in `messageKeyFnByType` (those that send data), do not send them
      // again if the data hasn't changed since the last message of the same type:
      return;
    }

    lastMessageKeyByType[type] = messageKey;
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
  user: SupabaseUser | null
): EmbeddedUserDetails {
  if (!user) return null;

  const userMetadata = user.user_metadata;
  const emailConfirmed =
    !!user.email_confirmed_at || userMetadata.email_verified;
  const phoneConfirmed =
    !!user.phone_confirmed_at || userMetadata.phone_verified;

  return {
    id: user.id,
    email: user.email || userMetadata.email || null,
    phone: user.phone || null,
    username: userMetadata.user_name || userMetadata.preferred_username || null,
    name: userMetadata.name || null,
    fullName: userMetadata.full_name || null,
    picture: userMetadata.avatar_url || userMetadata.picture || null,
    confirmed: !!user.confirmed_at || emailConfirmed || phoneConfirmed,
    emailConfirmed,
    phoneConfirmed,
    createdAt: new Date(user.created_at)
  };
}

export function getAuthProviderTypeFromSupabaseUser(
  user: SupabaseUser
): AuthProviderType | null {
  return (
    AUTH_PROVIDER_TYPE_BY_PROVIDER_STR[user?.app_metadata?.provider] || null
  );
}
