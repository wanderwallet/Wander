import { AllowanceAuthRequestView } from "~routes/auth/allowance";
import { LoadingAuthRequestView } from "~routes/auth/loading";
import { SignKeystoneAuthRequestView } from "~routes/auth/signKeystone";
import { SubscriptionAuthRequestView } from "~routes/auth/subscription";
import { UnlockAuthRequestView } from "~routes/auth/unlock";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { EmbeddedConnectAuthRequestView } from "~routes/embedded/auth-request/connect/connect.view";
import { EmbeddedSignDataAuthRequestView } from "~routes/embedded/auth-request/sign/signDataItem.view";
import { EmbeddedDecryptAuthRequestView } from "~routes/embedded/auth-request/decrypt/decrypt.view";
import { EmbeddedSignatureAuthRequestView } from "~routes/embedded/auth-request/signature/signature.view";
import { EmbeddedSignAuthRequestView } from "~routes/embedded/auth-request/sign/sign.view";
import { EmbeddedBatchSignDataItemAuthRequestView } from "~routes/embedded/auth-request/sign/batchSignDataItem.view";
import { EmbeddedConnectSettingsAuthRequestView } from "~routes/embedded/auth-request/connect/connect-settings.view";
import { EmbeddedConnectCustomAuthRequestView } from "~routes/embedded/auth-request/connect/connect-custom.view";
import { EmbeddedSignDetailsAuthRequestView } from "~routes/embedded/auth-request/sign/sign-details.view";

export type ConnectAuthRoutePath =
  | "/auth-request"
  | `/auth-request/connect/${string}`
  | `/auth-request/connect/${string}/settings`
  | `/auth-request/connect/${string}/custom`
  | `/auth-request/allowance/${string}`
  | `/auth-request/token/${string}`
  | `/auth-request/decrypt/${string}`
  | `/auth-request/sign/${string}`
  | `/auth-request/sign/${string}/details`
  | `/auth-request/signKeystone/${string}`
  | `/auth-request/signature/${string}`
  | `/auth-request/signDataItem/${string}`
  | `/auth-request/signDataItem/${string}/details`
  | `/auth-request/batchSignDataItem/${string}`
  | `/auth-request/subscription/${string}`;

export const ConnectAuthPaths = {
  Connect: "/auth-request/connect/:authID",
  ConnectSettings: "/auth-request/connect/:authID/settings",
  ConnectCustom: "/auth-request/connect/:authID/custom",
  Allowance: "/auth-request/allowance/:authID",
  Token: "/auth-request/token/:authID",
  Decrypt: "/auth-request/decrypt/:authID",
  Sign: "/auth-request/sign/:authID",
  SignDetails: "/auth-request/sign/:authID/details",
  SignKeystone: "/auth-request/signKeystone/:authID",
  Signature: "/auth-request/signature/:authID",
  SignDataItem: "/auth-request/signDataItem/:authID",
  SignDataItemDetails: "/auth-request/signDataItem/:authID/detail",
  BatchSignDataItem: "/auth-request/batchSignDataItem/:authID",
  Subscription: "/auth-request/subscription/:authID",
} as const satisfies Record<string, ConnectAuthRoutePath>;

export const CONNECT_AUTH_ROUTES = [
  ...getExtensionOverrides({
    unlockView: UnlockAuthRequestView,
    loadingView: LoadingAuthRequestView,
  }),
  {
    path: ConnectAuthPaths.Connect,
    component: EmbeddedConnectAuthRequestView,
  },
  {
    path: ConnectAuthPaths.ConnectSettings,
    component: EmbeddedConnectSettingsAuthRequestView,
  },
  {
    path: ConnectAuthPaths.ConnectCustom,
    component: EmbeddedConnectCustomAuthRequestView,
  },
  {
    path: ConnectAuthPaths.Allowance,
    component: AllowanceAuthRequestView,
  },
  {
    path: ConnectAuthPaths.Decrypt,
    component: EmbeddedDecryptAuthRequestView,
  },
  {
    path: ConnectAuthPaths.Sign,
    component: EmbeddedSignAuthRequestView,
  },
  {
    path: ConnectAuthPaths.SignDetails,
    component: EmbeddedSignDetailsAuthRequestView,
  },
  {
    path: ConnectAuthPaths.SignKeystone,
    component: SignKeystoneAuthRequestView,
  },
  {
    path: ConnectAuthPaths.Signature,
    component: EmbeddedSignatureAuthRequestView,
  },
  {
    path: ConnectAuthPaths.SignDataItem,
    component: EmbeddedSignDataAuthRequestView,
  },
  {
    path: ConnectAuthPaths.SignDataItemDetails,
    component: EmbeddedSignDetailsAuthRequestView,
  },
  {
    path: ConnectAuthPaths.BatchSignDataItem,
    component: EmbeddedBatchSignDataItemAuthRequestView,
  },
  {
    path: ConnectAuthPaths.Subscription,
    component: SubscriptionAuthRequestView,
  },
] as const satisfies RouteConfig[];
