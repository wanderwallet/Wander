import {
  EventMessage,
  EventMessageData,
  IncomingAuthMessageData,
  IncomingBalanceMessageData,
  IncomingMessage,
  IncomingMessageId,
  IncomingRequestMessageData,
  IncomingResizeMessageData,
  OutgoingMessage,
  WalletSwitchMessage
} from "./message.types";

export function isEventMessage(message: unknown): message is EventMessage {
  if (
    !message ||
    typeof message !== "object" ||
    !("id" in message && "type" in message && "data" in message) ||
    message.type !== "event"
  ) {
    return false;
  }

  const data = message.data as EventMessageData;

  // TODO: Validate the different value types/formats:
  return typeof data.name === "string";
}

export function isWalletSwitchMessage(
  message: unknown
): message is WalletSwitchMessage {
  if (
    !message ||
    typeof message !== "object" ||
    !("id" in message && "type" in message && "data" in message) ||
    message.type !== "switch_wallet_event"
  ) {
    return false;
  }

  const data = message.data as string | null;

  // TODO: Validate address format:
  return data === null || typeof data === "string";
}

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

      return !!(
        data &&
        typeof data === "object" &&
        typeof [
          "loading",
          "onboarding",
          "authenticated",
          "not-authenticated"
        ].includes(data.authStatus) &&
        (data.userId === null ||
          (!!data.userId && typeof data.userId === "string"))
      );
    }

    case "embedded_connect":
    case "embedded_disconnect":
    case "embedded_open":
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
        (data.amount === null || typeof data.amount === "number") &&
        (data.currency === null || typeof data.currency === "string") &&
        typeof data.formattedBalance == "string"
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
// TODO: Is this needed?
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
