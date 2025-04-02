import {
  extensionIsomorphicOnMessage,
  extensionIsomorphicSendMessage
} from "~utils/messaging/strategies/extension/extension-messaging.strategy";
import {
  iframeIsomorphicOnMessage,
  iframeIsomorphicSendMessage
} from "~utils/messaging/strategies/iframe/iframe-messaging.strategy";

// sendMessage():

export const isomorphicSendMessage =
  import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ? (iframeIsomorphicSendMessage satisfies typeof extensionIsomorphicSendMessage)
    : (extensionIsomorphicSendMessage satisfies typeof iframeIsomorphicSendMessage);

// onMessage():

export const isomorphicOnMessage =
  import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ? (iframeIsomorphicOnMessage satisfies typeof extensionIsomorphicOnMessage)
    : (extensionIsomorphicOnMessage satisfies typeof iframeIsomorphicOnMessage);
