import { AllowanceAuthRequestView } from "../../views/auth/allowance";
import { LoadingAuthRequestView } from "../../views/auth/loading";
import { SignKeystoneAuthRequestView } from "../../views/auth/signKeystone";
import { SubscriptionAuthRequestView } from "../../views/auth/subscription";
import { UnlockAuthRequestView } from "../../views/auth/unlock";
import { EmbeddedConnectAuthRequestView } from "../../views/auth-request/connect/connect.view";
import { EmbeddedSignDataAuthRequestView } from "../../views/auth-request/sign/signDataItem.view";
import { EmbeddedDecryptAuthRequestView } from "../../views/auth-request/decrypt/decrypt.view";
import { EmbeddedSignatureAuthRequestView } from "../../views/auth-request/signature/signature.view";
import { EmbeddedSignAuthRequestView } from "../../views/auth-request/sign/sign.view";
import { EmbeddedBatchSignDataItemAuthRequestView } from "../../views/auth-request/sign/batchSignDataItem.view";
import { EmbeddedConnectSettingsAuthRequestView } from "../../views/auth-request/connect/connect-settings.view";
import { EmbeddedConnectCustomAuthRequestView } from "../../views/auth-request/connect/connect-custom.view";
import { EmbeddedSignDetailsAuthRequestView } from "../../views/auth-request/sign/sign-details.view";
import { RouteConfig, getExtensionOverrides } from "@wanderapp/core";

export type ConnectAuthRoutePath =
  | "/auth-request"
  | `/auth-request/connect/${string}`
  | `/auth-request/connect/${string}/settings`
  | `/auth-request/connect/${string}/settings/custom`
  | `/auth-request/allowance/${string}`
  | `/auth-request/token/${string}`
  | `/auth-request/decrypt/${string}`
  | `/auth-request/sign/${string}`
  | `/auth-request/sign/${string}/details`
  | `/auth-request/signKeystone/${string}`
  // | `/auth-request/signKeystone/${string}/details
  | `/auth-request/signature/${string}`
  | `/auth-request/signDataItem/${string}`
  | `/auth-request/signDataItem/${string}/details`
  | `/auth-request/batchSignDataItem/${string}`
  | `/auth-request/subscription/${string}`;

export type ConnextTxDetailsRoutePath = Extract<
  ConnectAuthRoutePath,
  | `/auth-request/sign/${string}/details`
  // | `/auth-request/signKeystone/${string}/details`
  | `/auth-request/signDataItem/${string}/details`
>;

export const ConnectAuthPaths = {
  Connect: "/auth-request/connect/:authID",
  ConnectSettings: "/auth-request/connect/:authID/settings",
  ConnectSettingsCustom: "/auth-request/connect/:authID/settings/custom",
  Allowance: "/auth-request/allowance/:authID",
  Token: "/auth-request/token/:authID",
  Decrypt: "/auth-request/decrypt/:authID",
  Sign: "/auth-request/sign/:authID",
  SignDetails: "/auth-request/sign/:authID/details",
  SignKeystone: "/auth-request/signKeystone/:authID",
  // SignKeystoneDetails: "/auth-request/signKeystone/:authID/details",
  Signature: "/auth-request/signature/:authID",
  SignDataItem: "/auth-request/signDataItem/:authID",
  SignDataItemDetails: "/auth-request/signDataItem/:authID/details",
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
    path: ConnectAuthPaths.ConnectSettingsCustom,
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
  // {
  //   path: ConAuthPaths.SignKeystoneDetails,
  //   component: WalletTransactionDetailsEmbeddedView
  // },
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
