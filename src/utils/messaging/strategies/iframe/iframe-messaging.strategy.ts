import type { ProtocolMap } from "@arconnect/webext-bridge";
import { nanoid } from "nanoid";
import type { ApiCall, ApiResponse } from "shim";
import {
  EMBEDDED_ANCESTOR_TAB_ID,
  EMBEDDED_IFRAME_TAB_ID
} from "~utils/embedded/embedded.constants";
import { getEmbeddedAncestorOrigin } from "~utils/embedded/embedded.utils";
import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type {
  MessageData,
  MessageID,
  OnMessageCallback
} from "~utils/messaging/messaging.types";

const messageHandlersByMessageID: Partial<
  Record<MessageID, Set<OnMessageCallback<MessageID>>>
> = {};

let targetIframe: HTMLIFrameElement = null;
let targetOrigin = "";

export function setEmbeddedTargetIframe(iframeElement: HTMLIFrameElement) {
  targetIframe = iframeElement;
  targetOrigin = new URL(iframeElement.src).origin;
}

let messageCounter = 0;

function getPostMessageFunction<K extends MessageID>(
  messageData: MessageData<K>
): () => Promise<ReturnType<OnMessageCallback<K>>> {
  let postMessageTargetOrigin = "";

  const { destination, messageId, data } = messageData;

  // TODO: isInsideIframe is an incorrect check because we might be running the app standalone.

  if (destination === "background") {
    if (!isInsideIframe()) postMessageTargetOrigin = targetOrigin;
  } else if (destination.startsWith("content-script")) {
    if (!isInsideIframe())
      throw new Error(
        `Can only send messages to the "content-script" (SDK) from the "background" (iframe context).`
      );
    postMessageTargetOrigin = getEmbeddedAncestorOrigin();
  } else if (destination.startsWith("web_accessible")) {
    if (!isInsideIframe())
      throw new Error(
        `Can only send messages to "web_accessible" (auth popup) from the "background" (iframe context).`
      );
    postMessageTargetOrigin = "";
  }

  console.log(
    "DEBUG DATA = ",
    messageData,
    isInsideIframe(),
    postMessageTargetOrigin
  );

  if (postMessageTargetOrigin) {
    return async function postMessage() {
      console.log(`postMessage to ${postMessageTargetOrigin}`);

      return new Promise<ApiResponse>(async (resolve) => {
        targetIframe.contentWindow.postMessage(data, postMessageTargetOrigin);

        // TODO: Wait for response and return, but use the callbacks stored above.

        window.addEventListener("message", callback);

        // TODO: Declare outside (factory) to facilitate testing?
        async function callback(e: MessageEvent<ApiResponse>) {
          // TODO: Make sure the response comes from targetWindow.
          // See https://stackoverflow.com/questions/16266474/javascript-listen-for-postmessage-events-from-specific-iframe.

          let { data: res } = e;

          // validate return message
          if (`${data.type}_result` !== res.type) return;

          // only resolve when the result matching our callID is delivered
          if (data.callID !== res.callID) return;

          console.log("RESPONSE =", res);

          window.removeEventListener("message", callback);

          resolve(res);
        }
      });
    };
  }

  return async function sendMessageToCallback() {
    const messageHandlers = messageHandlersByMessageID[messageId];

    if (!messageHandlers) {
      console.warn(`No listeners registered for ${messageId}.`);

      return;
    }

    if (messageHandlers.size > 1) {
      console.warn(
        `${messageHandlers.size} handlers found for ${messageId}. Only the first response will be returned.`
      );
    }

    const resultPromises = Array.from(messageHandlers).map((messageHandler) => {
      // return messageHandler(data);

      return messageHandler({
        id: "0",
        timestamp: Date.now(),
        sender: {
          tabId: EMBEDDED_IFRAME_TAB_ID,
          context: null
        },
        data
      });
    });

    return await Promise.race(resultPromises);
  };
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

  return new Promise<ReturnType<OnMessageCallback<K>>>(async (resolve) => {
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
  messageHandlersByMessageID[messageId] ??= new Set();
  messageHandlersByMessageID[messageId].add(callback);

  if (messageHandlersByMessageID[messageId].size > 1) {
    // TODO: Are we adding the same listener multiple times?
    console.warn(
      "iframeIsomorphicOnMessage",
      messageId,
      messageHandlersByMessageID
    );
  }

  // Note that in Wander Embed, there are no ready messages, so the API/SDK must
  // make sure the iframe is ready before accepting method calls...
}

if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1" && isInsideIframe()) {
  // TODO: Set this up after first call to `iframeIsomorphicOnMessage`?

  console.log("Listening for messages...");

  window.addEventListener(
    "message",
    async ({ origin, data }: MessageEvent<ApiCall>) => {
      // if (origin === getEmbeddedAncestorOrigin()) console.log("DEBUG MESSAGE FROM PARENT =", data);

      if (
        !data ||
        origin !== getEmbeddedAncestorOrigin() ||
        data.app !== "wanderEmbedded"
      )
        return;

      const messageId = data.type === "chunk" ? "chunk" : "api_call";
      const messageHandlers =
        messageHandlersByMessageID[messageId as keyof ProtocolMap];

      if (!messageHandlers) {
        console.warn(`No listeners registered for ${messageId}.`);

        return;
      }

      if (messageHandlers.size > 1) {
        console.warn(
          `${messageHandlers.size} handlers found for ${messageId}. Only the first response will be returned.`
        );
      }

      console.log("MESSAGE FROM PARENT =", data, messageHandlers.size);

      const resultPromises = Array.from(messageHandlers).map(
        (messageHandler) => {
          return messageHandler({
            id: nanoid(),
            timestamp: Date.now(),
            data,
            sender: {
              tabId: EMBEDDED_ANCESTOR_TAB_ID,
              context: "content-script"
            }
          });
        }
      );

      const result = await Promise.race(resultPromises);

      console.log("result =", result);

      if (window.parent === null) {
        throw new Error("Unexpected `null` parent Window.");
      }

      // const responseMessage = {};

      window.parent.postMessage(result, getEmbeddedAncestorOrigin());

      // parentWindow.postMessage(result);

      // handleApiCallMessage({
      //   id: "",
      //   timestamp: Date.now(),
      //   data: event.data,
      //   sender: {
      //     tabId: 0,
      //     context: "content-script"
      //   }
      // });

      // Example: check if the message is from our SDK

      // if (event.data.type === "FROM_SDK") {
      //   const incomingMsg = event.data.payload;
      //   console.log(
      //     "Iframe received message from WanderEmbedded:",
      //     incomingMsg
      //   );

      //   // Respond back
      //   event.source?.postMessage({
      //     type: "FROM_IFRAME",
      //     payload: `Got your message: ${incomingMsg}`
      //   });
      // }
    }
  );
}
