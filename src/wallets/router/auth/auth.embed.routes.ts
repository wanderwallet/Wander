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
import { WalletPermissionsRequestEmbeddedView } from "~routes/embedded/wallet/settings/settings.request.view";
import { WalletSettingsCustomEmbeddedView } from "~routes/embedded/wallet/settings/settings.custom.view";
import { WalletTransactionDetailsEmbeddedView } from "~routes/embedded/wallet/sign/transaction.details.view";

export type ConAuthRoutePath =
  | "/auth-request"
  | `/auth-request/connect/${string}`
  | `/auth-request/connect/${string}/settings`
  | `/auth-request/connect/${string}/settings/custom`
  | `/auth-request/allowance/${string}`
  | `/auth-request/token/${string}`
  | `/auth-request/decrypt/${string}`
  | `/auth-request/sign/${string}`
  | `/auth-request/sign/${string}/tx`
  | `/auth-request/signKeystone/${string}`
  // | `/auth-request/signKeystone/${string}/tx`
  | `/auth-request/signature/${string}`
  | `/auth-request/signDataItem/${string}`
  | `/auth-request/signDataItem/${string}/tx`
  | `/auth-request/batchSignDataItem/${string}`
  | `/auth-request/subscription/${string}`;

export type ConTxDetailsRoutePath = Extract<
  ConAuthRoutePath,
  | `/auth-request/sign/${string}/tx`
  // | `/auth-request/signKeystone/${string}/tx`
  | `/auth-request/signDataItem/${string}/tx`
>;

export const ConAuthPaths = {
  Connect: "/auth-request/connect/:authID",
  ConnectSettings: "/auth-request/connect/:authID/settings",
  ConnectSettingsCustom: "/auth-request/connect/:authID/settings/custom",
  Allowance: "/auth-request/allowance/:authID",
  Token: "/auth-request/token/:authID",
  Decrypt: "/auth-request/decrypt/:authID",
  Sign: "/auth-request/sign/:authID",
  SignDetails: "/auth-request/sign/:authID/tx",
  SignKeystone: "/auth-request/signKeystone/:authID",
  // SignKeystoneDetails: "/auth-request/signKeystone/:authID/tx",
  Signature: "/auth-request/signature/:authID",
  SignDataItem: "/auth-request/signDataItem/:authID",
  SignDataItemDetails: "/auth-request/signDataItem/:authID/tx",
  BatchSignDataItem: "/auth-request/batchSignDataItem/:authID",
  Subscription: "/auth-request/subscription/:authID"
} as const satisfies Record<string, ConAuthRoutePath>;

export const CON_AUTH_ROUTES = [
  ...getExtensionOverrides({
    unlockView: UnlockAuthRequestView,
    loadingView: LoadingAuthRequestView
  }),
  {
    path: ConAuthPaths.Connect,
    component: EmbeddedConnectAuthRequestView
  },
  {
    path: ConAuthPaths.ConnectSettings,
    component: WalletPermissionsRequestEmbeddedView
  },
  {
    path: ConAuthPaths.ConnectSettingsCustom,
    component: WalletSettingsCustomEmbeddedView
  },
  {
    path: ConAuthPaths.Allowance,
    component: AllowanceAuthRequestView
  },
  {
    path: ConAuthPaths.Decrypt,
    component: EmbeddedDecryptAuthRequestView
  },
  {
    path: ConAuthPaths.Sign,
    component: EmbeddedSignAuthRequestView
  },
  {
    path: ConAuthPaths.SignDetails,
    component: WalletTransactionDetailsEmbeddedView
  },
  {
    path: ConAuthPaths.SignKeystone,
    component: SignKeystoneAuthRequestView
  },
  // {
  //   path: ConAuthPaths.SignKeystoneDetails,
  //   component: WalletTransactionDetailsEmbeddedView
  // },
  {
    path: ConAuthPaths.Signature,
    component: EmbeddedSignatureAuthRequestView
  },
  {
    path: ConAuthPaths.SignDataItem,
    component: EmbeddedSignDataAuthRequestView
  },
  {
    path: ConAuthPaths.SignDataItemDetails,
    component: WalletTransactionDetailsEmbeddedView
  },
  {
    path: ConAuthPaths.BatchSignDataItem,
    component: EmbeddedBatchSignDataItemAuthRequestView
  },
  {
    path: ConAuthPaths.Subscription,
    component: SubscriptionAuthRequestView
  }
] as const satisfies RouteConfig[];
