import {
  onMessage as webExtBridgeOnMessage,
  sendMessage as webExtBridgeSendMessage,
  type IBridgeMessage
} from "@arconnect/webext-bridge";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type {
  MessageData,
  MessageID,
  OnMessageCallback
} from "~utils/messaging/messaging.types";

const READY_MESSAGE_SUFFIX = "_ready" as const;

let messageCounter = 0;

function getSendMessageWithBridgeFunction<K extends MessageID>({
  destination,
  messageId,
  data
}: MessageData<K>) {
  return async function sendMessageWithBridge() {
    const result = await webExtBridgeSendMessage(
      messageId,
      data as any,
      destination
    );

    // check the result
    if (
      result &&
      typeof result === "object" &&
      result.hasOwnProperty("error")
    ) {
      throw new Error(
        result.hasOwnProperty("data")
          ? (result as any).data
          : "Unknown webExtBridge error."
      );
    }

    return result;
  };
}

/**
 * Send a message of `<messageId>` type to the specific `tabId` or background straight away. If that message fails
 * because no one is listening, listen for `<messageId>${ READY_MESSAGE_SUFFIX }` messages for 6 seconds, and try to send the message again
 * once that's received, or throw a time out error otherwise.
 */
export async function extensionIsomorphicSendMessage<K extends MessageID>(
  messageData: MessageData<K>
) {
  // See the "Receive API calls" comment in `ArConnect/src/contents/api.ts` for more on message passing.

  const { destination, messageId } = messageData;

  const tabId = parseInt(destination.split("@")[1] || "0");

  if (isNaN(tabId)) {
    throw new Error("Unexpected NaN tabId");
  }

  const currentMessage = messageCounter++;

  // TODO: Check if removing this broke anything:
  // const destination = tabId ? `web_accessible@${tabId}` : "background";

  const sendMessageFunction = getSendMessageWithBridgeFunction(messageData);

  return new Promise(async (resolve, reject) => {
    let timeoutTimeoutID = 0;
    let retryIntervalID = 0;

    function resolveAndClearTimeouts(value: unknown) {
      clearTimeout(timeoutTimeoutID);
      clearInterval(retryIntervalID);

      resolve(value);
    }

    function rejectAndClearTimeouts(reason?: any) {
      clearTimeout(timeoutTimeoutID);
      clearInterval(retryIntervalID);

      reject(reason);
    }

    log(
      LOG_GROUP.MSG,
      `[${currentMessage}] Sending ${messageId} to ${destination}`
    );

    sendMessageFunction()
      .then((result) => {
        log(LOG_GROUP.MSG, `[${currentMessage}] ${messageId} sent`);

        resolveAndClearTimeouts(result);
      })
      .catch((err) => {
        const errorMessage = `${err.message || ""}`;

        // TODO: This won't work with the embedded wallet/postMessage, but it might not be an issue... Maybe it's better
        // to just create 2 different versions of isomorphicSendMessage?
        if (
          !/No handler registered in '.+' to accept messages with id '.+'/.test(
            errorMessage
          ) ||
          messageId.endsWith(READY_MESSAGE_SUFFIX)
        ) {
          log(LOG_GROUP.MSG, `[${currentMessage}] ${messageId} error =`, err);

          rejectAndClearTimeouts(err);

          return;
        }

        // The retry after ready logic below will NOT run if `messageId` already ends in `READY_MESSAGE_SUFFIX`:

        log(
          LOG_GROUP.MSG,
          `[${currentMessage}] Waiting for ${messageId}${READY_MESSAGE_SUFFIX}`
        );

        timeoutTimeoutID = window.setTimeout(() => {
          reject(
            new Error(
              `Timed out waiting for ${messageId}${READY_MESSAGE_SUFFIX} from ${destination}`
            )
          );
        }, 6000);

        // TODO: Implement retry in case the initial call to `sendMessage()` above fails and the "ready" event is never
        // received (e.g. popup opens, `sendMessage()` fails, background sends "ready" event, popup starts listening for
        // ready event).
        // retryIntervalID = setInterval(() => {}, 2000);

        async function handleTabReady({ sender }: IBridgeMessage<any>) {
          // validate sender by it's tabId
          if (sender.tabId !== tabId) {
            return;
          }

          log(
            LOG_GROUP.MSG,
            `[${currentMessage}] Sending ${messageId} to ${destination} again`
          );

          await sendMessageFunction()
            .then((result) => {
              log(LOG_GROUP.MSG, `[${currentMessage}] ${messageId} resent`);

              resolveAndClearTimeouts(result);
            })
            .catch((err) => {
              log(
                LOG_GROUP.MSG,
                `[${currentMessage}] ${messageId} error again =`,
                err
              );

              rejectAndClearTimeouts(err);
            });
        }

        webExtBridgeOnMessage(
          `${messageId}${READY_MESSAGE_SUFFIX}`,
          handleTabReady as any
        );
      });
  });
}

// TODO: Type tabId as `web_accessible@${number}` | `content-script@${tab.id}`

// TODO: In the embedded wallet, there are no ready messages, so the API/SDK must make sure the iframe is ready before
// accepting method calls...

export function extensionIsomorphicOnMessage<K extends MessageID>(
  messageId: K,
  callback: OnMessageCallback<K>
): void {
  // TODO: In embedded, verify that:
  // - The messages come from iframeWindow if we are in the app domain.
  // - The messages come from window.parent if we are in the iframe.

  webExtBridgeOnMessage(messageId, callback as any);

  // TODO: In the embedded, there are no ready messages (I suppose?). We need to sync opening the "auth popup" someone.

  // TODO: Is this needed for all messages or only for some?
  extensionIsomorphicSendMessage({
    destination: "background",
    messageId: `${messageId}${READY_MESSAGE_SUFFIX}` as any,
    data: null
  });
}
