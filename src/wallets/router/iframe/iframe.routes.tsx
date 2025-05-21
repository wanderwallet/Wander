import { AUTH_ROUTES } from "~wallets/router/auth/auth.embed.routes";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import { POPUP_ROUTES } from "~wallets/router/popup/popup.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { isRouteOverride } from "~wallets/router/router.utils";

// Authentication Views:
import { AuthEmbeddedView } from "~routes/embedded/auth/auth/auth.view";
import { AuthEmailSignUpEmbeddedView } from "~routes/embedded/auth/auth-email-sign-up/auth-email-signup.view";
import { AuthMoreProvidersEmbeddedView } from "~routes/embedded/auth/auth-more-providers/auth-more-providers.view";
import { AuthAddWalletEmbeddedView } from "~routes/embedded/auth/add-wallet/auth-add-wallet.view";
import { AuthImportSeedphraseEmbeddedView } from "~routes/embedded/auth/import-seedphrase/auth-import-seedphrase.view";
import { AuthImportKeyfileEmbeddedView } from "~routes/embedded/auth/import-keyfile/auth-import-keyfile.view";
import { AuthErrorEmbeddedView } from "~routes/embedded/auth/auth-error/auth-error.view";
import { AuthAddWithQRCodeEmbeddedView } from "~routes/embedded/auth/add-qrcode/add-qrcode.view";
import { AuthQRCodeScannerEmbeddedView } from "~routes/embedded/auth/qrcode-scanner/auth-qrcode-scanner.view";

// Authentication Linking Views:
import { AuthAddDeviceEmbeddedView } from "~routes/embedded/auth/add-device/auth-add-device.view";
import { AuthAddAuthProviderEmbeddedView } from "~routes/embedded/auth/add-auth-provider/auth-add-auth-provider.view";

// Shares Views:
import { AuthRestoreSharesEmbeddedView } from "~routes/embedded/auth/restore-shares/auth-restore-shares.view";
import { AuthRestoreSharesRecoveryFileEmbeddedView } from "~routes/embedded/auth/restore-shares/recovery-file/auth-restore-shares-recovery-file.view";
import { AuthRestoreSharesSeedPhraseEmbeddedView } from "~routes/embedded/auth/restore-shares/seedphrase/auth-restore-shares-seedphrase.view";
import { AuthRestoreSharesKeyfileEmbeddedView } from "~routes/embedded/auth/restore-shares/keyfile/auth-restore-shares-keyfile.view";

// Account Recovery Views:
import { AuthRecoverAccountEmbeddedView } from "~routes/embedded/auth/recover-account/auth-recover-account.view";
import { AuthRecoverAccountSeedphraseEmbeddedView } from "~routes/embedded/auth/recover-account/seedphrase/auth-recover-account-seedphrase.view";
import { AuthRecoverAccountKeyfileEmbeddedView } from "~routes/embedded/auth/recover-account/keyfile/auth-recover-account-keyfile.view";
import { AuthRecoverAccountSelectEmbeddedView } from "~routes/embedded/auth/recover-account/select-account/auth-recover-account-select.view";
import { AuthRecoverAccountConfirmEmbeddedView } from "~routes/embedded/auth/recover-account/auth-recover-confirm.view";

// Account Management Views:
import { AccountConfirmationEmbeddedView } from "~routes/embedded/account/confirmation/account-confirmation.view";
import { AccountAddWalletEmbeddedView } from "~routes/embedded/account/add-wallet/account-add-wallet.view";
import { AccountImportSeedphraseEmbeddedView } from "~routes/embedded/account/import-seedphrase/account-import-seedphrase.view";
import { AccountImportKeyfileEmbeddedView } from "~routes/embedded/account/import-keyfile/account-import-keyfile.view";

// Account Backup Views:
import { AccountBackupWalletReminderEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet-reminder.view";
import { AccountBackupWalletEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet.view";
import { AccountBackupCopySeedphraseEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet-copy-seedphrase.view";
import { AccountBackupFullWalletEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-full-wallet.view";
import { AccountBackupWalletRecoveryFileEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet-recovery-file.view";
import { AccountExportWalletEmbeddedView } from "~routes/embedded/account/export-wallet/account-export-wallet.view";

import { WalletHomeEmbeddedView } from "~routes/embedded/wallet/home/wallet.view";
import { WalletReceiveEmbeddedView } from "~routes/embedded/wallet/receive/receive.view";
import { WalletTransactionsEmbeddedView } from "~routes/embedded/wallet/transactions/transactions.view";
import { WalletTransactionsHistoryEmbeddedView } from "~routes/embedded/wallet/transactions-history/transactions-history.view";
import { WalletPermissionsRequestEmbeddedView } from "~routes/embedded/wallet/settings/settings.request.view";
import { WalletSettingsCustomEmbeddedView } from "~routes/embedded/wallet/settings/settings.custom.view";
import { WalletTransactionCompleteEmbeddedView } from "~routes/embedded/wallet/sign/transaction-complete.view";
import { WalletTransactionDetailsEmbeddedView } from "~routes/embedded/wallet/sign/transaction.details.view";
import { WalletBuyEmbeddedView } from "~routes/embedded/wallet/buy/buy.container.view";
import { WalletBuyCashEmbeddedView } from "~routes/embedded/wallet/buy/buy.cash.view";
import { WalletReceiveOptionsEmbeddedView } from "~routes/embedded/wallet/receive/options/receive.options.view";
import { WalletDepositTokensEmbeddedView } from "~routes/embedded/wallet/deposit/deposit.container.view";
import { WalletBuyInputEmbeddedView } from "~routes/embedded/wallet/buy/buy.input.view";
import { WalletBuySuccessEmbeddedView } from "~routes/embedded/wallet/buy/buy.success.view";
import { EmbeddedConnectAuthRequestView } from "~routes/embedded/wallet/connect/dapp-connect.view";
import { AuthEmailVerifyEmbeddedView } from "~routes/embedded/auth/auth-email-verify/auth-email-verify.view";
import { AuthEmailSignInEmbeddedView } from "~routes/embedded/auth/auth-email-sign-in/auth-email-sign-in.view";

export type EmbeddedRoutePath =
  | "/auth"
  | "/auth/email-signup"
  | "/auth/email-signin"
  | "/auth/email-verify"
  | "/auth/more-providers"
  | "/auth/add-wallet"
  | "/auth/import-seedphrase"
  | "/auth/import-keyfile"
  | "/auth/add-device"
  | "/auth/confirmation"
  | "/auth/add-auth-provider"
  | "/auth/restore-shares"
  | "/auth/restore-shares/recovery-file"
  | "/auth/restore-shares/seedphrase"
  | "/auth/restore-shares/keyfile"
  | "/auth/add-qrcode"
  | "/auth/qrcode-scanner"
  // | "/auth/restore-shares/<backupProvider>"
  | "/auth/recover-account"
  | "/auth/recover-account/seedphrase"
  | "/auth/recover-account/keyfile"
  // | "/auth/recover-account/authentication"
  // | "/auth/recover-account/more-authentication"
  | "/auth/recover-account/select"
  | "/auth/recover-account/confirm"
  | "/account"
  | "/account/confirmation"
  // | "/account/add-provider"
  // | "/account/add-provider/more-providers"
  | "/account/add-wallet"
  | "/account/import-seedphrase"
  | "/account/import-keyfile"
  | "/account/backup-wallet"
  | "/account/backup-wallet/full"
  | "/account/backup-wallet/copy-seedphrase"
  | "/account/backup-wallet/recovery-file"
  // | "/account/backup-shares/<backupProvider>"
  | "/account/backup-wallet/reminder"
  | "/account/export-wallet"
  | "/auth/error"
  | "/"
  | "/wallet"
  | "/wallet/receive"
  | "/wallet/receive/options"
  | "/wallet/transactions"
  | "/wallet/transactions-history"
  | "/wallet/settings"
  | "/wallet/settings/custom"
  | "/wallet/transaction"
  | "/wallet/transaction-details"
  | `/wallet/transaction-complete/${string}`
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
  AuthEmailSignup: "/auth/email-signup",
  AuthEmailSignin: "/auth/email-signin",
  AuthEmailVerify: "/auth/email-verify",
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
  AuthRestoreSharesSeedPhrase: "/auth/restore-shares/seedphrase",
  AuthRestoreSharesKeyfile: "/auth/restore-shares/keyfile",

  // Account Recovery:
  AuthRecoverAccount: "/auth/recover-account",
  AuthRecoverAccountSeedphrase: "/auth/recover-account/seedphrase",
  AuthRecoverAccountKeyfile: "/auth/recover-account/keyfile",
  AuthRecoverAccountSelect: "/auth/recover-account/select",
  AuthRecoverAccountConfirm: "/auth/recover-account/confirm",

  // Account Management:
  AccountConfirmation: "/account/confirmation",
  AccountAddWallet: "/account/add-wallet",
  AccountImportSeedphrase: "/account/import-seedphrase",
  AccountImportKeyfile: "/account/import-keyfile",

  // Backup:
  AccountBackupWallet: "/account/backup-wallet",
  AccountBackupFullWallet: "/account/backup-wallet/full",
  AccountBackupCopySeedphrase: "/account/backup-wallet/copy-seedphrase",
  AccountBackupWalletRecoveryFile: "/account/backup-wallet/recovery-file",
  AccountBackupWalletReminder: "/account/backup-wallet/reminder",
  AccountExportWallet: "/account/export-wallet",

  // OAuth Error:
  AuthError: "/auth/error",
  WalletDefaultHomeEmbeddedView: "/",
  WalletHomeEmbeddedView: "/wallet",
  WalletReceiveEmbeddedView: "/wallet/receive",
  WalletReceiveOptionsEmbeddedView: "/wallet/receive/options",
  WalletTransactionsEmbeddedView: "/wallet/transactions",
  WalletTransactionsHistoryEmbeddedView: "/wallet/transactions-history",
  WalletPermissionsRequestEmbeddedView: "/wallet/settings",
  WalletSettingsCustomEmbeddedView: "/wallet/settings/custom",
  WalletTransactionDetailsEmbeddedView: "/wallet/transaction-details",
  WalletTransactionCompleteEmbeddedView: "/wallet/transaction-complete/:id",
  WalletBuyEmbeddedView: "/wallet/buy",
  WalletBuyCashEmbeddedView: "/wallet/buy/cash",
  WalletDepositTokensEmbeddedView: "/wallet/deposit",
  WalletBuyInputEmbeddedView: "/wallet/buy/crypto",
  WalletBuySuccessEmbeddedView: "/wallet/buy/success",
  ConnectEmbeddedView: "/wallet/connect",

  // TODO: Add pages to add/link additional auth methods or devices post-auth (under /account)
} as const satisfies Record<string, EmbeddedRoutePath>;

const IFRAME_OWN_ROUTES = [
  // Authentication:

  {
    path: EmbeddedPaths.Auth,
    component: AuthEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthEmailSignup,
    component: AuthEmailSignUpEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthEmailVerify,
    component: AuthEmailVerifyEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthEmailSignin,
    component: AuthEmailSignInEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthMoreProviders,
    component: AuthMoreProvidersEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthAddWallet,
    component: AuthAddWalletEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthImportSeedPhrase,
    component: AuthImportSeedphraseEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthImportKeyfile,
    component: AuthImportKeyfileEmbeddedView,
  },
  {
    path: EmbeddedPaths.ConnectEmbeddedView,
    component: EmbeddedConnectAuthRequestView,
  },

  // Authentication Linking:

  {
    path: EmbeddedPaths.AuthAddDevice,
    component: AuthAddDeviceEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthAddAuthProvider,
    component: AuthAddAuthProviderEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthAddWithQRCode,
    component: AuthAddWithQRCodeEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthQRCodeScanner,
    component: AuthQRCodeScannerEmbeddedView,
  },

  // Shares Recovery:

  {
    path: EmbeddedPaths.AuthRestoreShares,
    component: AuthRestoreSharesEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRestoreSharesRecoveryFile,
    component: AuthRestoreSharesRecoveryFileEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRestoreSharesSeedPhrase,
    component: AuthRestoreSharesSeedPhraseEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRestoreSharesKeyfile,
    component: AuthRestoreSharesKeyfileEmbeddedView,
  },

  // Account Recovery:

  {
    path: EmbeddedPaths.AuthRecoverAccount,
    component: AuthRecoverAccountEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountSeedphrase,
    component: AuthRecoverAccountSeedphraseEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountKeyfile,
    component: AuthRecoverAccountKeyfileEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountSelect,
    component: AuthRecoverAccountSelectEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountConfirm,
    component: AuthRecoverAccountConfirmEmbeddedView,
  },

  // Account Management:

  {
    path: EmbeddedPaths.AccountConfirmation,
    component: AccountConfirmationEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountAddWallet,
    component: AccountAddWalletEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountImportSeedphrase,
    component: AccountImportSeedphraseEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountImportKeyfile,
    component: AccountImportKeyfileEmbeddedView,
  },

  // Backup:

  {
    path: EmbeddedPaths.AccountBackupWalletReminder,
    component: AccountBackupWalletReminderEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupFullWallet,
    component: AccountBackupFullWalletEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupWallet,
    component: AccountBackupWalletEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupCopySeedphrase,
    component: AccountBackupCopySeedphraseEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupWalletRecoveryFile,
    component: AccountBackupWalletRecoveryFileEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountExportWallet,
    component: AccountExportWalletEmbeddedView,
  },

  // Wallet:
  {
    path: EmbeddedPaths.WalletDefaultHomeEmbeddedView,
    component: WalletHomeEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletHomeEmbeddedView,
    component: WalletHomeEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletReceiveEmbeddedView,
    component: WalletReceiveEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletTransactionsEmbeddedView,
    component: WalletTransactionsEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletTransactionsHistoryEmbeddedView,
    component: WalletTransactionsHistoryEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletPermissionsRequestEmbeddedView,
    component: WalletPermissionsRequestEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletSettingsCustomEmbeddedView,
    component: WalletSettingsCustomEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletTransactionDetailsEmbeddedView,
    component: WalletTransactionDetailsEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletTransactionCompleteEmbeddedView,
    component: WalletTransactionCompleteEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletBuyEmbeddedView,
    component: WalletBuyEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletBuyCashEmbeddedView,
    component: WalletBuyCashEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletReceiveOptionsEmbeddedView,
    component: WalletReceiveOptionsEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletDepositTokensEmbeddedView,
    component: WalletDepositTokensEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletBuyInputEmbeddedView,
    component: WalletBuyInputEmbeddedView,
  },
  {
    path: EmbeddedPaths.WalletBuySuccessEmbeddedView,
    component: WalletBuySuccessEmbeddedView,
  },
] as const satisfies RouteConfig<EmbeddedRoutePath>[];

export const IFRAME_ROUTES = [
  // TODO: Update with actual fallbacks, even thought these are not supposed to be used:
  ...getExtensionOverrides({
    unlockView: () => <p>Placeholder Unlock</p>,
    loadingView: () => <p>Placeholder Loading</p>,
  }),

  // popup.tsx:
  // ...POPUP_ROUTES.filter((route) => !isRouteOverride(route.path)),

  // auth.tsx: filter out the settings path as it's defined in IFRAME_OWN_ROUTES
  ...AUTH_ROUTES.filter((route) => !isRouteOverride(route.path) && !route.path.includes("/wallet/settings/")),

  // OAuth Error:
  {
    path: EmbeddedPaths.AuthError,
    component: AuthErrorEmbeddedView,
  },

  // Embedded wallet only:
  ...IFRAME_OWN_ROUTES,
] as const satisfies RouteConfig[];
