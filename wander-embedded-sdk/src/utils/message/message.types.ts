// INCOMING MESSAGES (iframe => SDK):

import { InjectedEvents } from "wallet-api/src/utils/events";
import { BalanceInfo, RouteConfig } from "../../wander-embedded.types";

// embedded_auth:

export type EmbeddedAuthStatus =
  | "loading"
  | "onboarding"
  | "authenticated"
  | "not-authenticated";

export interface IncomingAuthMessageData {
  authStatus: EmbeddedAuthStatus;
  userId: null | string;
}

// embedded_resize

export type IncomingResizeMessageData = RouteConfig;

// embedded_balance:

export type IncomingBalanceMessageData = BalanceInfo;

// embedded_request

export interface IncomingRequestMessageData {
  pendingRequests: number;
  hasNewConnectRequest: boolean;
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

export type IncomingConnectMessage = BaseIncomingMessage<
  "embedded_connect",
  void
>;

export type IncomingDisconnectMessage = BaseIncomingMessage<
  "embedded_disconnect",
  void
>;

export type IncomingOpenMessage = BaseIncomingMessage<"embedded_open", void>;

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
  | IncomingConnectMessage
  | IncomingDisconnectMessage
  | IncomingOpenMessage
  | IncomingCloseMessage
  | IncomingResizeMessage
  | IncomingBalanceMessage
  | IncomingRequestMessage;

export type IncomingMessageId = IncomingMessage["type"];

// INCOMING EVENT MESSAGES (iframe => SDK => dApp (mitt)):

export interface EventMessageData<
  K extends keyof InjectedEvents = keyof InjectedEvents
> {
  name: K;
  value: InjectedEvents[K];
}

export type EventMessage<
  K extends keyof InjectedEvents = keyof InjectedEvents
> = BaseIncomingMessage<"event", EventMessageData<K>>;

// INCOMING WALLET SWITCH MESSAGE

export type WalletSwitchMessage = BaseIncomingMessage<
  "switch_wallet_event",
  string | null
>;

// OUTGOING MESSAGES (SDK => iframe):

export type OutgoingMessage = {
  type: "THEME_UPDATE" | "BALANCE_CURRENCY";
  payload: string;
};
