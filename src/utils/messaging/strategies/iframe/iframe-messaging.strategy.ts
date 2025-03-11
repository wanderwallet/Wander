import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { MessageData, MessageID } from "~utils/messaging/messaging.types";

let messageCounter = 0;

function getPostMessageFunction<K extends MessageID>({
  destination,
  messageId,
  data
}: MessageData<K>) {
  let targetWindow: Window = window;

  if (destination.startsWith("content-script")) targetWindow = window.parent;
  else if (destination === "background") targetWindow = getIFrameWindow();

  return async function postMessage() {};
}

/**
 * Send a message of `<messageId>` type to the specific `tabId` or background straight away. If that message fails
 * because no one is listening, listen for `<messageId>${ READY_MESSAGE_SUFFIX }` messages for 6 seconds, and try to send the message again
 * once that's received, or throw a time out error otherwise.
 */
export async function iframeIsomorphicSendMessage<K extends MessageID>(
  messageData: MessageData<K>
) {
  // See the "Receive API calls" comment in `ArConnect/src/contents/api.ts` for more on message passing.

  const { destination, messageId } = messageData;

  const tabId = parseInt(destination.split("@")[1] || "0");

  if (isNaN(tabId)) {
    throw new Error("Unexpected NaN tabId");
  }

  const currentMessage = messageCounter++;

  const sendMessageFunction = getPostMessageFunction(messageData);

  return new Promise(async (resolve) => {
    log(
      LOG_GROUP.MSG,
      `[${currentMessage}] Sending ${messageId} to ${destination}`
    );

    sendMessageFunction().then((result) => {
      log(LOG_GROUP.MSG, `[${currentMessage}] ${messageId} sent`);

      resolve(result);
    });
  });
}

export function iframeIsomorphicOnMessage<K extends MessageID>(
  messageId: K,
  callback: OnMessageCallback<K>
): void {
  // TODO: In embedded, verify that:
  // - The messages come from iframeWindow if we are in the app domain.
  // - The messages come from window.parent if we are in the iframe.

  // TODO: In the embedded wallet, there are no ready messages, so the API/SDK must make sure the iframe is ready before
  // accepting method calls...

  webExtBridgeOnMessage(messageId, callback as any);
}
