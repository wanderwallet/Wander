import type { AuthProviderType } from "embed-api";
import type { EmbeddedLayout, RouteType } from "~utils/embedded/utils/routes/embedded-routes.utils";

export type EmbeddedMessageId =
  | "embedded_auth"
  | "embedded_open"
  | "embedded_close"
  | "embedded_resize"
  | "embedded_balance"
  | "embedded_request";

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

export interface EmbeddedAuthNativeMessageData {
  authType: "NATIVE_WALLET";
  authStatus: null;
  userDetails: null;
}

export interface EmbeddedAuthNoAuthMessageData {
  authType: null;
  authStatus: "not-authenticated";
  userDetails: null;
}

export interface EmbeddedAuthLoadingMessageData {
  authType?: AuthProviderType;
  authStatus: "loading";
  userDetails: EmbeddedUserDetails;
}
export interface EmbeddedAuthCompletedMessageData {
  authType: AuthProviderType;
  authStatus: "onboarding" | "authenticated";
  userDetails: EmbeddedUserDetails;
}

export type EmbeddedAuthMessageData =
  | EmbeddedAuthNativeMessageData
  | EmbeddedAuthNoAuthMessageData
  | EmbeddedAuthLoadingMessageData
  | EmbeddedAuthCompletedMessageData;

export interface EmbeddedResizeMessageData {
  routeType: RouteType;
  preferredLayoutType: EmbeddedLayout;
  width?: number;
  height: number;
}

export interface EmbeddedBalanceMessageData {
  amount: number;
  currency: "USD" | "EUR"; // TODO: Replace with a type that includes all options in the settings?
  formattedBalance: string;
}

export interface EmbeddedRequestMessageData {
  pendingRequests: number;
  hasNewConnectRequest: boolean;
}

export interface EmbeddedMessageMap {
  embedded_auth: EmbeddedAuthMessageData;
  embedded_open: void;
  embedded_close: void;
  embedded_resize: EmbeddedResizeMessageData;
  embedded_balance: EmbeddedBalanceMessageData;
  embedded_request: EmbeddedRequestMessageData;
}

export interface EmbeddedCall<K extends EmbeddedMessageId> {
  id: string;
  type: K;
  data: EmbeddedMessageMap[K];
}
