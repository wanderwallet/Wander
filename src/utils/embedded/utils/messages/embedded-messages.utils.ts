import { nanoid } from "nanoid";
import { EMBEDDED_PARENT_ORIGIN } from "~utils/embedded/sdk/utils/url/sdk-url.utils";
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

  const parent = window.parent;

  if (parent === null) {
    throw new Error("Unexpected `null` parent Window.");
  }

  const call: EmbeddedCall<K> = {
    id: nanoid(),
    type,
    data
  };

  if (parent === window) {
    console.warn(
      "ArConnect Embedded running as a standalone page. There's no parent Window to send this to =",
      call
    );

    return;
  }

  parent.postMessage(call, EMBEDDED_PARENT_ORIGIN);
}
