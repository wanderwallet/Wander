import {
  IncomingAuthMessageData,
  IncomingBalanceMessageData,
  IncomingMessage,
  IncomingMessageId,
  IncomingRequestMessageData,
  IncomingResizeMessage,
  IncomingResizeMessageData,
  OutgoingMessage
} from "./message.types";

// Type guard for incoming messages
export function isIncomingMessage(
  message: unknown
): message is IncomingMessage {
  if (
    !message ||
    typeof message !== "object" ||
    !("id" in message && "type" in message && "data" in message)
  ) {
    return false;
  }

  switch (message.type as IncomingMessageId) {
    case "embedded_auth": {
      const data = message.data as IncomingAuthMessageData;

      return !!(data && typeof data === "object" && "userDetails" in data);
    }

    case "embedded_close":
      return true;

    case "embedded_resize": {
      const data = message.data as IncomingResizeMessageData;

      return !!(
        data &&
        typeof data === "object" &&
        typeof data.routeType === "string" &&
        typeof data.preferredLayoutType === "string" &&
        typeof data.height === "number"
      );
    }

    case "embedded_balance": {
      const data = message.data as IncomingBalanceMessageData;

      return !!(
        data &&
        typeof data === "object" &&
        typeof data.amount === "number" &&
        typeof data.currency === "string"
      );
    }

    case "embedded_request": {
      const data = message.data as IncomingRequestMessageData;

      return !!(
        data &&
        typeof data === "object" &&
        typeof data.pendingRequests === "number"
      );
    }

    default:
      return false;
  }
}

// Type guard for outgoing messages
export function isOutgoingMessage(message: any): message is OutgoingMessage {
  if (!message || typeof message !== "object" || !message.type) return false;

  switch (message.type) {
    case "THEME_UPDATE":
      return (
        message.payload &&
        typeof message.payload === "object" &&
        typeof message.payload.primary === "string" &&
        typeof message.payload.secondary === "string"
      );
    case "WALLET_CONNECTED":
      return (
        message.payload &&
        typeof message.payload === "object" &&
        typeof message.payload.address === "string"
      );
    case "WALLET_DISCONNECTED":
      return true;
    default:
      return false;
  }
}
