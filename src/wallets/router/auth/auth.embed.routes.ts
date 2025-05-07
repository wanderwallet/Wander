import { AllowanceAuthRequestView } from "~routes/auth/allowance";
import { LoadingAuthRequestView } from "~routes/auth/loading";
import { SignKeystoneAuthRequestView } from "~routes/auth/signKeystone";
import { SubscriptionAuthRequestView } from "~routes/auth/subscription";
import { UnlockAuthRequestView } from "~routes/auth/unlock";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { EmbeddedConnectAuthRequestView } from "~routes/embedded/wallet/connect/dapp-connect.view";
import { EmbeddedSignDataAuthRequestView } from "~routes/embedded/wallet/sign/transaction-signdata.view";
import { EmbeddedDecryptAuthRequestView } from "~routes/embedded/wallet/decrypt/decrypt.view";
import { EmbeddedSignatureAuthRequestView } from "~routes/embedded/wallet/signature/signature.view";
import { EmbeddedSignAuthRequestView } from "~routes/embedded/wallet/sign/transaction.sign.view";
import { EmbeddedBatchSignDataItemAuthRequestView } from "~routes/embedded/wallet/sign/transaction-batch-signdata.view";

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
  Subscription: "/auth-request/subscription/:authID",
} as const satisfies Record<string, AuthRoutePath>;

export const AUTH_ROUTES = [
  ...getExtensionOverrides({
    unlockView: UnlockAuthRequestView,
    loadingView: LoadingAuthRequestView,
  }),
  {
    path: AuthPaths.Connect,
    component: EmbeddedConnectAuthRequestView,
  },
  {
    path: AuthPaths.Allowance,
    component: AllowanceAuthRequestView,
  },
  {
    path: AuthPaths.Decrypt,
    component: EmbeddedDecryptAuthRequestView,
  },
  {
    path: AuthPaths.Sign,
    component: EmbeddedSignAuthRequestView,
  },
  {
    path: AuthPaths.SignKeystone,
    component: SignKeystoneAuthRequestView,
  },
  {
    path: AuthPaths.Signature,
    component: EmbeddedSignatureAuthRequestView,
  },
  {
    path: AuthPaths.SignDataItem,
    component: EmbeddedSignDataAuthRequestView,
  },
  {
    path: AuthPaths.BatchSignDataItem,
    component: EmbeddedBatchSignDataItemAuthRequestView,
  },
  {
    path: AuthPaths.Subscription,
    component: SubscriptionAuthRequestView,
  },
] as const satisfies RouteConfig[];
