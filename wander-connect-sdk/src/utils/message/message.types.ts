// INCOMING MESSAGES (iframe => SDK):

import { InjectedEvents } from "wallet-api/src/utils/events";
import { AuthInfo, AuthProviderType, BalanceInfo, RequestsInfo, RouteConfig } from "../../wander-connect.types";

// embedded_auth:

export type IncomingAuthMessageData = AuthInfo;

// embedded_resize

export type IncomingResizeMessageData = RouteConfig;

// embedded_balance:

export type IncomingBalanceMessageData = BalanceInfo;

// embedded_request

export type IncomingRequestMessageData = RequestsInfo;

// IncomingMessage:

export interface BaseIncomingMessage<K extends string = string, D = void> {
  id: string;
  type: K;
  data: D;
}

export type IncomingAuthMessage = BaseIncomingMessage<"embedded_auth", IncomingAuthMessageData>;

export type IncomingOpenMessage = BaseIncomingMessage<"embedded_open", void>;

export type IncomingCloseMessage = BaseIncomingMessage<"embedded_close", void>;

export type IncomingResizeMessage = BaseIncomingMessage<"embedded_resize", IncomingResizeMessageData>;

export type IncomingBalanceMessage = BaseIncomingMessage<"embedded_balance", IncomingBalanceMessageData>;

export type IncomingRequestMessage = BaseIncomingMessage<"embedded_request", IncomingRequestMessageData>;

export type IncomingMessage =
  | IncomingAuthMessage
  | IncomingOpenMessage
  | IncomingCloseMessage
  | IncomingResizeMessage
  | IncomingBalanceMessage
  | IncomingRequestMessage;

export type IncomingMessageId = IncomingMessage["type"];

// INCOMING EVENT MESSAGES (iframe => SDK => dApp (mitt)):

export type EventMessageData = {
  [K in keyof InjectedEvents]: { name: K; value: InjectedEvents[K] };
}[keyof InjectedEvents];

export type EventMessage = BaseIncomingMessage<"event", EventMessageData>;

// INCOMING WALLET SWITCH MESSAGE

export type WalletSwitchMessage = BaseIncomingMessage<"switch_wallet_event", string | null>;

// OUTGOING MESSAGES (SDK => iframe):

// export type OutgoingMessage = {
//   type: "THEME_UPDATE" | "BALANCE_CURRENCY" | "SIGN_OUT";
//   payload: string;
// };
