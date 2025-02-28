import { AllowanceAuthRequestView } from "~routes/auth/allowance";
import { BatchSignDataItemAuthRequestView } from "~routes/auth/batchSignDataItem";
import { ConnectAuthRequestView } from "~routes/auth/connect";
import { DecryptAuthRequestView } from "~routes/auth/decrypt";
import { LoadingAuthRequestView } from "~routes/auth/loading";
import { SignAuthRequestView } from "~routes/auth/sign";
import { SignatureAuthRequestView } from "~routes/auth/signature";
import { SignDataItemAuthRequestView } from "~routes/auth/signDataItem";
import { SignKeystoneAuthRequestView } from "~routes/auth/signKeystone";
import { SubscriptionAuthRequestView } from "~routes/auth/subscription";
import { UnlockAuthRequestView } from "~routes/auth/unlock";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { RouteConfig } from "~wallets/router/router.types";

export type AuthRoutePath =
  | "/auth-request"
  | `/auth-request/connect/${string}`
  | `/auth-request/allowance/${string}`
  | `/auth-request/token/${string}`
  | `/auth-request/decrypt/${string}`
  | `/auth-request/sign/${string}`
  | `/auth-request/signKeystone/${string}`
  | `/auth-request/signature/${string}`
  | `/auth-request/signDataItem/${string}`
  | `/auth-request/batchSignDataItem/${string}`
  | `/auth-request/subscription/${string}`;

export const AuthPaths = {
  Connect: "/auth-request/connect/:authID",
  Allowance: "/auth-request/allowance/:authID",
  Token: "/auth-request/token/:authID",
  Decrypt: "/auth-request/decrypt/:authID",
  Sign: "/auth-request/sign/:authID",
  SignKeystone: "/auth-request/signKeystone/:authID",
  Signature: "/auth-request/signature/:authID",
  SignDataItem: "/auth-request/signDataItem/:authID",
  BatchSignDataItem: "/auth-request/batchSignDataItem/:authID",
  Subscription: "/auth-request/subscription/:authID"
} as const satisfies Record<string, AuthRoutePath>;

export const AUTH_ROUTES = [
  ...getExtensionOverrides({
    unlockView: UnlockAuthRequestView,
    loadingView: LoadingAuthRequestView
  }),
  {
    path: AuthPaths.Connect,
    component: ConnectAuthRequestView
  },
  {
    path: AuthPaths.Allowance,
    component: AllowanceAuthRequestView
  },
  {
    path: AuthPaths.Decrypt,
    component: DecryptAuthRequestView
  },
  {
    path: AuthPaths.Sign,
    component: SignAuthRequestView
  },
  {
    path: AuthPaths.SignKeystone,
    component: SignKeystoneAuthRequestView
  },
  {
    path: AuthPaths.Signature,
    component: SignatureAuthRequestView
  },
  {
    path: AuthPaths.SignDataItem,
    component: SignDataItemAuthRequestView
  },
  {
    path: AuthPaths.BatchSignDataItem,
    component: BatchSignDataItemAuthRequestView
  },
  {
    path: AuthPaths.Subscription,
    component: SubscriptionAuthRequestView
  }
] as const satisfies RouteConfig[];
