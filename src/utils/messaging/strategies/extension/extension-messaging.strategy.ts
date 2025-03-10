import {
  onMessage as webExtBridgeOnMessage,
  sendMessage as webExtBridgeSendMessage,
  type IBridgeMessage
} from "@arconnect/webext-bridge";
import type { ApiCall } from "shim";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { isApiErrorResponse } from "~utils/messaging/common/messaging.utils";
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
    console.log("webExtBridgeSendMessage =", messageId, destination, data);

    const result = await webExtBridgeSendMessage<any, K>(
      messageId,
      data as any,
      destination.replace("popup", "web_accessible")
    );

    console.log("webExtBridgeSendMessage RESULT =", result);

    debugger;

    // check the result
    if (isApiErrorResponse(result)) {
      throw new Error(result.data || "Unknown webExtBridge error.");
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
        debugger;

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

        timeoutTimeoutID = setTimeout(() => {
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

export function extensionIsomorphicOnMessage<K extends MessageID>(
  messageId: K,
  callback: OnMessageCallback<K>
): void {
  webExtBridgeOnMessage(messageId, callback as any);

  if (messageId === "auth_request") {
    extensionIsomorphicSendMessage({
      destination: "background",
      messageId: `${messageId}${READY_MESSAGE_SUFFIX}` as any,
      data: null
    });
  }
}
