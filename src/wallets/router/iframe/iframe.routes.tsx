import { AUTH_ROUTES } from "~wallets/router/auth/auth.routes";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import { POPUP_ROUTES } from "~wallets/router/popup/popup.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { isRouteOverride } from "~wallets/router/router.utils";

// Authentication Views:
import { AuthEmbeddedView } from "~routes/embedded/auth/auth/auth.view";
import { AuthMoreProvidersEmbeddedView } from "~routes/embedded/auth/auth-more-providers/auth-more-providers.view";
import { AuthAddWalletEmbeddedView } from "~routes/embedded/auth/add-wallet/auth-add-wallet.view";
import { AuthImportSeedphraseEmbeddedView } from "~routes/embedded/auth/import-seedphrase/auth-import-seedphrase.view";
import { AuthImportKeyfileEmbeddedView } from "~routes/embedded/auth/import-keyfile/auth-import-keyfile.view";
import AuthErrorEmbeddedView from "~routes/embedded/auth/auth-error/auth-error.view";
import { AuthAddWithQRCodeEmbeddedView } from "~routes/embedded/auth/add-qrcode/add-qrcode.view";
import { AuthQRCodeScannerEmbeddedView } from "~routes/embedded/auth/qrcode-scanner/auth-qrcode-scanner.view";

// Authentication Linking Views:
import { AuthAddDeviceEmbeddedView } from "~routes/embedded/auth/add-device/auth-add-device.view";
import { AuthAddAuthProviderEmbeddedView } from "~routes/embedded/auth/add-auth-provider/auth-add-auth-provider.view";

// Shares Views:
import { AuthRestoreSharesEmbeddedView } from "~routes/embedded/auth/restore-shares/auth-restore-shares.view";
import { AuthRestoreSharesRecoveryFileEmbeddedView } from "~routes/embedded/auth/restore-shares/recovery-file/auth-restore-shares-recovery-file.view";

// Account Recovery Views:
import { AuthRecoverAccountEmbeddedView } from "~routes/embedded/auth/recover-account/auth-recover-account.view";
import { AuthRecoverAccountSeedphraseEmbeddedView } from "~routes/embedded/auth/recover-account/seedphrase/auth-recover-account-seedphrase.view";
import { AuthRecoverAccountKeyfileEmbeddedView } from "~routes/embedded/auth/recover-account/keyfile/auth-recover-account-keyfile.view";
import { AuthRecoverAccountAuthenticationEmbeddedView } from "~routes/embedded/auth/recover-account/authentication/auth-recover-account-authentication.view";
import { AuthRecoverAccountMoreAuthenticationEmbeddedView } from "~routes/embedded/auth/recover-account/more-authentication/auth-recover-account-more-authentication.view";

// Account Management Views:
import { AccountEmbeddedView } from "~routes/embedded/account/account/account.view";
import { AccountConfirmationEmbeddedView } from "~routes/embedded/account/confirmation/account-confirmation.view";
import { AccountAddWalletEmbeddedView } from "~routes/embedded/account/add-wallet/account-add-wallet.view";
import { AccountImportSeedphraseEmbeddedView } from "~routes/embedded/account/import-seedphrase/account-import-seedphrase.view";
import { AccountImportKeyfileEmbeddedView } from "~routes/embedded/account/import-keyfile/account-import-keyfile.view";

// Account Backup Views:
import { AccountBackupSharesReminderEmbeddedView } from "~routes/embedded/account/backup-shares-reminder/account-backup-shares-reminder.view";
import { AccountBackupSharesEmbeddedView } from "~routes/embedded/account/backup-shares/account-backup-shares.view";
import { AccountExportWalletEmbeddedView } from "~routes/embedded/account/export-wallet/account-export-wallet.view";

import { WalletHomeEmbeddedView } from "~routes/embedded/wallet/home/wallet.view";
import { WalletReceiveEmbeddedView } from "~routes/embedded/wallet/receive/receive.view";
import { WalletTransactionsEmbeddedView } from "~routes/embedded/wallet/transactions/transactions.view";
import { WalletSettingsCustomEmbeddedView } from "~routes/embedded/wallet/settings/settings.custom.view";
import { WalletTransactionSignEmbeddedView } from "~routes/embedded/wallet/home/transaction-sign/transaction.sign.view";
import { WalletTransactionDetailsEmbeddedView } from "~routes/embedded/wallet/home/transaction-details/transaction.details.view";
import { WalletBuyEmbeddedView } from "~routes/embedded/wallet/buy/buy.container.view";
import { WalletBuyCashEmbeddedView } from "~routes/embedded/wallet/buy/buy.cash.view";
import { WalletReceiveOptionsEmbeddedView } from "~routes/embedded/wallet/receive/options/receive.options.view";
import { WalletDepositTokensEmbeddedView } from "~routes/embedded/wallet/deposit/deposit.container.view";
import { WalletBuyInputEmbeddedView } from "~routes/embedded/wallet/buy/buy.input.view";
import { WalletBuySuccessEmbeddedView } from "~routes/embedded/wallet/buy/buy.success.view";
import { WalletTransactionsHistoryEmbeddedView } from "~routes/embedded/wallet/transactions-history/transactions-history.view";
import { EmbeddedConnectAuthRequestView } from "~routes/embedded/wallet/connect/dapp-connect.view";
export type EmbeddedRoutePath =
  | "/auth"
  | "/auth/more-providers"
  | "/auth/add-wallet"
  | "/auth/import-seedphrase"
  | "/auth/import-keyfile"
  | "/auth/add-device"
  | "/auth/confirmation"
  | "/auth/add-auth-provider"
  | "/auth/restore-shares"
  | "/auth/restore-shares/recovery-file"
  | "/auth/add-qrcode"
  | "/auth/qrcode-scanner"
  // | "/auth/restore-shares/<backupProvider>"
  | "/auth/recover-account"
  | "/auth/recover-account/seedphrase"
  | "/auth/recover-account/keyfile"
  | "/auth/recover-account/authentication"
  | "/auth/recover-account/more-authentication"
  | "/account"
  | "/account/confirmation"
  // | "/account/add-provider"
  // | "/account/add-provider/more-providers"
  | "/account/add-wallet"
  | "/account/import-seedphrase"
  | "/account/import-keyfile"
  | "/account/backup-shares"
  // | "/account/backup-shares/<backupProvider>"
  | "/account/backup-shares/reminder"
  | "/account/export-wallet"
  | "/auth/error"
  | "/wallet"
  | "/wallet/receive"
  | "/wallet/receive/options"
  | "/wallet/transactions"
  | "/wallet/transactions-history"
  | "/wallet/settings"
  | "/wallet/settings/custom"
  | "/wallet/transaction"
  | "/wallet/transaction-details"
  | "/wallet/buy"
  | "/wallet/buy/cash"
  | "/wallet/buy/crypto"
  | "/wallet/buy/input"
  | "/wallet/deposit"
  | "/wallet/buy/success"
  | "/wallet/connect";

export const EmbeddedPaths = {
  // TODO: Consider nesting these instead:

  // Authentication:
  Auth: "/auth",
  AuthMoreProviders: "/auth/more-providers",
  AuthAddWallet: "/auth/add-wallet",
  AuthImportSeedPhrase: "/auth/import-seedphrase",
  AuthImportKeyfile: "/auth/import-keyfile",

  // Authentication Linking:
  AuthAddDevice: "/auth/add-device",
  AuthAddAuthProvider: "/auth/add-auth-provider",
  AuthAddWithQRCode: "/auth/add-qrcode",
  AuthQRCodeScanner: "/auth/qrcode-scanner",
  // Shares Recovery:
  AuthRestoreShares: "/auth/restore-shares",
  AuthRestoreSharesRecoveryFile: "/auth/restore-shares/recovery-file",

  // Account Recovery:
  AuthRecoverAccount: "/auth/recover-account",
  AuthRecoverAccountSeedphrase: "/auth/recover-account/seedphrase",
  AuthRecoverAccountKeyfile: "/auth/recover-account/keyfile",
  AuthRecoverAccountAuthentication: "/auth/recover-account/authentication",
  AuthRecoverAccountMoreAuthentication:
    "/auth/recover-account/more-authentication",

  // Account Management:
  Account: "/account",
  AccountConfirmation: "/account/confirmation",
  AccountAddWallet: "/account/add-wallet",
  AccountImportSeedphrase: "/account/import-seedphrase",
  AccountImportKeyfile: "/account/import-keyfile",

  // Backup:
  AccountBackupShares: "/account/backup-shares",
  AccountBackupSharesReminder: "/account/backup-shares/reminder",
  AccountExportWallet: "/account/export-wallet",

  // OAuth Error:
  AuthError: "/auth/error",
  WalletHomeEmbeddedView: "/wallet",
  WalletReceiveEmbeddedView: "/wallet/receive",
  WalletReceiveOptionsEmbeddedView: "/wallet/receive/options",
  WalletTransactionsEmbeddedView: "/wallet/transactions",
  WalletTransactionsHistoryEmbeddedView: "/wallet/transactions-history",
  WalletSettingsEmbeddedView: "/wallet/settings",
  WalletSettingsCustomEmbeddedView: "/wallet/settings/custom",
  WalletTransactionSignEmbeddedView: "/wallet/transaction",
  WalletTransactionDetailsEmbeddedView: "/wallet/transaction-details",
  WalletBuyEmbeddedView: "/wallet/buy",
  WalletBuyCashEmbeddedView: "/wallet/buy/cash",
  WalletDepositTokensEmbeddedView: "/wallet/deposit",
  WalletBuyInputEmbeddedView: "/wallet/buy/crypto",
  WalletBuySuccessEmbeddedView: "/wallet/buy/success",
  ConnectEmbeddedView: "/wallet/connect"

  // TODO: Add pages to add/link additional auth methods or devices post-auth (under /account)
} as const satisfies Record<string, EmbeddedRoutePath>;

const IFRAME_OWN_ROUTES = [
  // Authentication:

  {
    path: EmbeddedPaths.Auth,
    component: AuthEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthMoreProviders,
    component: AuthMoreProvidersEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthAddWallet,
    component: AuthAddWalletEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthImportSeedPhrase,
    component: AuthImportSeedphraseEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthImportKeyfile,
    component: AuthImportKeyfileEmbeddedView
  },
  {
    path: EmbeddedPaths.ConnectEmbeddedView,
    component: EmbeddedConnectAuthRequestView
  },

  // Authentication Linking:

  {
    path: EmbeddedPaths.AuthAddDevice,
    component: AuthAddDeviceEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthAddAuthProvider,
    component: AuthAddAuthProviderEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthAddWithQRCode,
    component: AuthAddWithQRCodeEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthQRCodeScanner,
    component: AuthQRCodeScannerEmbeddedView
  },

  // Shares Recovery:

  {
    path: EmbeddedPaths.AuthRestoreShares,
    component: AuthRestoreSharesEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthRestoreSharesRecoveryFile,
    component: AuthRestoreSharesRecoveryFileEmbeddedView
  },

  // Account Recovery:

  {
    path: EmbeddedPaths.AuthRecoverAccount,
    component: AuthRecoverAccountEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountSeedphrase,
    component: AuthRecoverAccountSeedphraseEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountKeyfile,
    component: AuthRecoverAccountKeyfileEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountAuthentication,
    component: AuthRecoverAccountAuthenticationEmbeddedView
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountMoreAuthentication,
    component: AuthRecoverAccountMoreAuthenticationEmbeddedView
  },

  // Account Management:

  {
    path: EmbeddedPaths.Account,
    component: AccountEmbeddedView
  },
  {
    path: EmbeddedPaths.AccountConfirmation,
    component: AccountConfirmationEmbeddedView
  },
  {
    path: EmbeddedPaths.AccountAddWallet,
    component: AccountAddWalletEmbeddedView
  },
  {
    path: EmbeddedPaths.AccountImportSeedphrase,
    component: AccountImportSeedphraseEmbeddedView
  },
  {
    path: EmbeddedPaths.AccountImportKeyfile,
    component: AccountImportKeyfileEmbeddedView
  },

  // Backup:

  {
    path: EmbeddedPaths.AccountBackupSharesReminder,
    component: AccountBackupSharesReminderEmbeddedView
  },
  {
    path: EmbeddedPaths.AccountBackupShares,
    component: AccountBackupSharesEmbeddedView
  },
  {
    path: EmbeddedPaths.AccountExportWallet,
    component: AccountExportWalletEmbeddedView
  },

  // Wallet:
  {
    path: EmbeddedPaths.WalletHomeEmbeddedView,
    component: WalletHomeEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletReceiveEmbeddedView,
    component: WalletReceiveEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletTransactionsEmbeddedView,
    component: WalletTransactionsEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletSettingsEmbeddedView,
    component: WalletBuyEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletSettingsCustomEmbeddedView,
    component: WalletSettingsCustomEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletTransactionSignEmbeddedView,
    component: WalletTransactionSignEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletTransactionDetailsEmbeddedView,
    component: WalletTransactionDetailsEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletBuyEmbeddedView,
    component: WalletBuyEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletBuyCashEmbeddedView,
    component: WalletBuyCashEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletReceiveOptionsEmbeddedView,
    component: WalletReceiveOptionsEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletDepositTokensEmbeddedView,
    component: WalletDepositTokensEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletBuyInputEmbeddedView,
    component: WalletBuyInputEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletBuySuccessEmbeddedView,
    component: WalletBuySuccessEmbeddedView
  },
  {
    path: EmbeddedPaths.WalletTransactionsHistoryEmbeddedView,
    component: WalletTransactionsHistoryEmbeddedView
  }
] as const satisfies RouteConfig<EmbeddedRoutePath>[];

export const IFRAME_ROUTES = [
  // TODO: Update with actual fallbacks, even thought these are not supposed to be used:
  ...getExtensionOverrides({
    unlockView: () => <p>Placeholder Unlock</p>,
    loadingView: () => <p>Placeholder Loading</p>
  }),

  // popup.tsx:
  ...POPUP_ROUTES.filter((route) => !isRouteOverride(route.path)),

  // auth.tsx:
  ...AUTH_ROUTES.filter((route) => !isRouteOverride(route.path)),

  // OAuth Error:
  {
    path: EmbeddedPaths.AuthError,
    component: AuthErrorEmbeddedView
  },

  // Embedded wallet only:
  ...IFRAME_OWN_ROUTES
] as const satisfies RouteConfig[];
