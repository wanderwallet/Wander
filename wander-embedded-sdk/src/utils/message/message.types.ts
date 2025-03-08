// INCOMING MESSAGES (iframe => SDK):

import { BalanceInfo, RouteConfig } from "../../wander-embedded.types";

// embedded_auth:

export interface UserDetails {
  // TODO: Add props
}

export interface IncomingAuthMessageData {
  userDetails: null | UserDetails;
}

// embedded_resize

export type IncomingResizeMessageData = RouteConfig;

// embedded_balance:

export type IncomingBalanceMessageData = BalanceInfo;

// embedded_request

export interface IncomingRequestMessageData {
  pendingRequests: number;
}

// IncomingMessage:

export interface BaseIncomingMessage<K extends string = string, D = void> {
  id: string;
  type: K;
  data: D;
}

export type IncomingAuthMessage = BaseIncomingMessage<
  "embedded_auth",
  IncomingAuthMessageData
>;
export type IncomingCloseMessage = BaseIncomingMessage<"embedded_close", void>;
export type IncomingResizeMessage = BaseIncomingMessage<
  "embedded_resize",
  IncomingResizeMessageData
>;
export type IncomingBalanceMessage = BaseIncomingMessage<
  "embedded_balance",
  IncomingBalanceMessageData
>;
export type IncomingRequestMessage = BaseIncomingMessage<
  "embedded_request",
  IncomingRequestMessageData
>;

export type IncomingMessage =
  | IncomingAuthMessage
  | IncomingCloseMessage
  | IncomingResizeMessage
  | IncomingBalanceMessage
  | IncomingRequestMessage;

export type IncomingMessageId = IncomingMessage["type"];

// OUTGOING MESSAGES (SDK => iframe):

export type OutgoingMessage = {
  type: "THEME_UPDATE" | "BALANCE_CURRENCY";
  payload: string;
};
