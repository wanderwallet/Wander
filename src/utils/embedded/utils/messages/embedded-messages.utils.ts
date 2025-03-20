import { nanoid } from "nanoid";
import { getEmbeddedAncestorOrigin } from "~utils/embedded/embedded.utils";
import { isInsideIframe } from "~utils/embedded/iframe.utils";
import type {
  EmbeddedCall,
  EmbeddedMessageId,
  EmbeddedMessageMap
} from "~utils/embedded/utils/messages/embedded-messages.types";

const EMBEDDED_MESSAGE_IDS = [
  "embedded_auth",
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

  parent.postMessage(call, getEmbeddedAncestorOrigin());
}
