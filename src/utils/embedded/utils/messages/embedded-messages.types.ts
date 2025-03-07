import type {
  EmbeddedLayout,
  RouteType
} from "~utils/embedded/utils/routes/embedded-routes.utils";

export type EmbeddedMessageId =
  | "embedded_auth"
  | "embedded_close"
  | "embedded_resize"
  | "embedded_balance"
  | "embedded_request";

export interface EmbeddedAuthMessageData {
  userDetails: any; // TODO: TBD
}

export interface EmbeddedResizeMessageData {
  routeType: RouteType;
  preferredLayoutType: EmbeddedLayout;
  width?: number;
  height: number;
}

export interface EmbeddedBalanceMessageData {
  amount: number;
  currency: "USD" | "EUR"; // TODO: Replace with a type that includes all options in the settings?
}

export interface EmbeddedRequestMessageData {
  pendingRequests: number;
}

export interface EmbeddedMessageMap {
  embedded_auth: EmbeddedAuthMessageData;
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
