// INCOMING MESSAGES (iframe => SDK):

import { InjectedEvents } from "wallet-api/src/utils/events";
import { BalanceInfo, RouteConfig } from "../../wander-embedded.types";

// embedded_auth:

export type EmbeddedAuthProviderType =
  | "PASSKEYS"
  | "EMAIL_N_PASSWORD"
  | "GOOGLE"
  | "FACEBOOK"
  | "X"
  | "APPLE";

export type EmbeddedAuthStatus =
  | "loading"
  | "onboarding"
  | "authenticated"
  | "not-authenticated";

export interface EmbeddedUserDetails {
  id: string;
  email: null | string;
  phone: null | string;
  username: null | string;
  name: null | string;
  fullName: null | string;
  picture: null | string;
  confirmed: boolean;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  createdAt: Date;
}

export interface IncomingAuthNativeMessageData {
  authType: "NATIVE_WALLET";
  authStatus: null;
  userDetails: null;
}

export interface IncomingAuthNoAuthMessageData {
  authType: null;
  authStatus: "not-authenticated";
  userDetails: null;
}

export interface IncomingAuthLoadingMessageData {
  authType: EmbeddedAuthProviderType;
  authStatus: "loading";
  userDetails?: EmbeddedUserDetails;
}

export interface IncomingAuthCompletedMessageData {
  authType: EmbeddedAuthProviderType;
  authStatus: "onboarding" | "authenticated";
  userDetails: EmbeddedUserDetails;
}

export type IncomingAuthMessageData =
  | IncomingAuthNativeMessageData
  | IncomingAuthNoAuthMessageData
  | IncomingAuthLoadingMessageData
  | IncomingAuthCompletedMessageData;

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

export type WalletSwitchMessage = BaseIncomingMessage<
  "switch_wallet_event",
  string | null
>;

// OUTGOING MESSAGES (SDK => iframe):

export type OutgoingMessage = {
  type: "THEME_UPDATE" | "BALANCE_CURRENCY";
  payload: string;
};
