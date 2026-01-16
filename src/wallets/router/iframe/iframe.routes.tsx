import { CONNECT_AUTH_ROUTES } from "~wallets/router/auth/auth.embed.routes";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { isRouteOverride } from "~wallets/router/router.utils";

// Support Views:
import { UnpartitionedStateMissingEmbeddedView } from "~routes/embedded/support/unpartitioned-state/unpartitioned-state.view";

// Authentication Views:
import { AuthEmbeddedView } from "~routes/embedded/auth/auth/auth.view";
import { AuthEmailOtpEmbeddedView } from "~routes/embedded/auth/auth-email-otp/auth-email-otp.view";
import { AuthEmailSignInPasswordEmbeddedView } from "~routes/embedded/auth/auth-email-sign-in-password/auth-email-sign-in-password.view";
import { AuthEmailVerifyEmbeddedView } from "~routes/embedded/auth/auth-email-verify/auth-email-verify.view";
import { AuthMoreProvidersEmbeddedView } from "~routes/embedded/auth/auth-more-providers/auth-more-providers.view";
import { AuthAddWalletEmbeddedView } from "~routes/embedded/auth/add-wallet/auth-add-wallet.view";
import { AuthImportWalletEmbeddedView } from "~routes/embedded/auth/add-wallet/auth-import-wallet.view";
import { AuthImportSeedphraseEmbeddedView } from "~routes/embedded/auth/import-seedphrase/auth-import-seedphrase.view";
import { AuthImportKeyfileEmbeddedView } from "~routes/embedded/auth/import-keyfile/auth-import-keyfile.view";
import { AuthImportQrCodeEmbeddedView } from "~routes/embedded/auth/import-qrcode/auth-import-qrcode";

// Authentication Linking Views:
import { AuthAddDeviceEmbeddedView } from "~routes/embedded/auth/add-device/auth-add-device.view";
import { AuthAddAuthProviderEmbeddedView } from "~routes/embedded/auth/add-auth-provider/auth-add-auth-provider.view";

// Shares Views:
import { AuthRestoreSharesEmbeddedView } from "~routes/embedded/auth/restore-shares/auth-restore-shares.view";
import { AuthRestoreSharesCreateConfirmationEmbeddedView } from "~routes/embedded/auth/restore-shares/create-confirmation/auth-restore-shares-create-confirmation.view";
import { AuthRestoreSharesRecoveryFileEmbeddedView } from "~routes/embedded/auth/restore-shares/recovery-file/auth-restore-shares-recovery-file.view";
import { AuthRestoreSharesSeedPhraseEmbeddedView } from "~routes/embedded/auth/restore-shares/seedphrase/auth-restore-shares-seedphrase.view";
import { AuthRestoreSharesKeyfileEmbeddedView } from "~routes/embedded/auth/restore-shares/keyfile/auth-restore-shares-keyfile.view";
import { AuthRestoreSharesQrCodeEmbeddedView } from "~routes/embedded/auth/restore-shares/qrcode/auth-restore-shares-qrcode.view";

// Account Recovery Views:
import { AuthRecoverAccountEmbeddedView } from "~routes/embedded/auth/recover-account/auth-recover-account.view";
import { AuthRecoverAccountOtpEmbeddedView } from "~routes/embedded/auth/recover-account/otp/auth-recover-account-otp.view";
import { AuthRecoverAccountSeedphraseEmbeddedView } from "~routes/embedded/auth/recover-account/seedphrase/auth-recover-account-seedphrase.view";
import { AuthRecoverAccountKeyfileEmbeddedView } from "~routes/embedded/auth/recover-account/keyfile/auth-recover-account-keyfile.view";
import { AuthRecoverAccountQrCodeEmbeddedView } from "~routes/embedded/auth/recover-account/qrcode/auth-recover-account-qrcode.view";
import { AuthRecoverAccountSelectEmbeddedView } from "~routes/embedded/auth/recover-account/select-account/auth-recover-account-select.view";
import { AuthRecoverAccountConfirmEmbeddedView } from "~routes/embedded/auth/recover-account/confirm/auth-recover-confirm.view";

// Account Management Views:
import { AccountChangePasswordEmbeddedView } from "~routes/embedded/account/change-password/account-change-password.view";

// Account Wallet Views:
import { AccountAddWalletEmbeddedView } from "~routes/embedded/account/add-wallet/account-add-wallet.view";
import { AccountImportSeedphraseEmbeddedView } from "~routes/embedded/account/import-seedphrase/account-import-seedphrase.view";
import { AccountImportKeyfileEmbeddedView } from "~routes/embedded/account/import-keyfile/account-import-keyfile.view";

// Account Backup Views:
import { AccountBackupWalletEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet.view";
import { AccountBackupCopySeedphraseEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet-copy-seedphrase.view";
import { AccountBackupFullWalletEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-full-wallet.view";
import { AccountBackupWalletRecoveryFileEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet-recovery-file.view";
import { AccountBackupWalletQrCodeEmbeddedView } from "~routes/embedded/account/backup-wallet/backup-wallet-qrcode";
import { AccountExportWalletEmbeddedView } from "~routes/embedded/account/export-wallet/account-export-wallet.view";

// Wallet Views:
import { WalletHomeEmbeddedView } from "~routes/embedded/wallet/home/wallet.view";
import { WalletReceiveEmbeddedView } from "~routes/embedded/wallet/receive/receive.view";
import { WalletTransactionsEmbeddedView } from "~routes/embedded/wallet/transactions/transactions.view";
import { WalletTransactionsHistoryEmbeddedView } from "~routes/embedded/wallet/transactions-history/transactions-history.view";
import { WalletTransactionCompleteEmbeddedView } from "~routes/embedded/wallet/transactions/transaction-complete.view";
import { WalletBuyEmbeddedView } from "~routes/embedded/wallet/buy/buy.container.view";
import { WalletBuyCashEmbeddedView } from "~routes/embedded/wallet/buy/buy.cash.view";
import { WalletReceiveOptionsEmbeddedView } from "~routes/embedded/wallet/receive/options/receive.options.view";
import { WalletDepositTokensEmbeddedView } from "~routes/embedded/wallet/deposit/deposit.container.view";
import { WalletBuyInputEmbeddedView } from "~routes/embedded/wallet/buy/buy.input.view";
import { WalletBuySuccessEmbeddedView } from "~routes/embedded/wallet/buy/buy.success.view";
import { AccountBackupCloudEmbeddedView } from "~routes/embedded/account/backup-wallet/cloud/backup-cloud.view";
import { AccountBackupCloudChangeProviderEmbeddedView } from "~routes/embedded/account/backup-wallet/cloud/backup-cloud-change-provider.view";
import { AccountBackupCloudImportEmbeddedView } from "~routes/embedded/account/backup-wallet/cloud/backup-cloud-import.view";
import { CongratulationsEmbeddedView } from "~routes/embedded/account/congratulations/congratulations.view";
import { AccountBackupCloudImportSuccessEmbeddedView } from "~routes/embedded/account/backup-wallet/cloud/backup-cloud-import-success.view";

/**
 * Developers can manually navigate to these flows:
 */
export type DirectAccess = "backup" | "home" | "receive" | "receive-address" | "buy" | "transactions";

export type EmbeddedRoutePath =
  | "/support/unpartitioned-state"
  | "/auth"
  | "/auth/otp"
  | "/auth/email-signin/password"
  | "/auth/email-verify"
  | "/auth/more-providers"
  | "/auth/add-wallet"
  | "/auth/import-wallet"
  | "/auth/import-seedphrase"
  | "/auth/import-keyfile"
  | "/auth/import-qrcode"
  | "/auth/add-device"
  | "/auth/confirmation"
  | "/auth/add-auth-provider"
  | "/auth/restore-shares"
  | "/auth/restore-shares/create-confirmation"
  | "/auth/restore-shares/recovery-file"
  | "/auth/restore-shares/seedphrase"
  | "/auth/restore-shares/keyfile"
  | "/auth/restore-shares/qrcode"
  | "/auth/add-qrcode"
  | "/auth/qrcode-scanner"
  // | "/auth/restore-shares/<backupProvider>"
  | "/auth/recover-account"
  | "/auth/recover-account/otp"
  | "/auth/recover-account/seedphrase"
  | "/auth/recover-account/keyfile"
  | "/auth/recover-account/qrcode"
  // | "/auth/recover-account/authentication"
  // | "/auth/recover-account/more-authentication"
  | "/auth/recover-account/select"
  | "/auth/recover-account/confirm"
  | "/account"
  | "/account/change-password"
  // | "/account/add-provider"
  // | "/account/add-provider/more-providers"
  | "/account/add-wallet"
  | "/account/import-seedphrase"
  | "/account/import-keyfile"
  | "/account/backup-wallet"
  | "/account/backup-wallet/full"
  | "/account/backup-wallet/copy-seedphrase"
  | "/account/backup-wallet/recovery-file"
  | "/account/backup-wallet/qrcode"
  | "/account/backup-wallet/cloud"
  | "/account/backup-wallet/cloud/change-provider"
  | "/account/backup-wallet/cloud/import"
  | "/account/backup-wallet/cloud/import-success"
  | "/account/congratulations"
  // | "/account/backup-shares/<backupProvider>"
  | "/account/export-wallet"
  | "/"
  | "/wallet/receive"
  | "/wallet/receive/options"
  | "/wallet/transactions"
  | "/wallet/transactions-history"
  | "/wallet/transaction"
  | `/wallet/transaction-complete/${string}`
  | "/wallet/buy"
  | "/wallet/buy/cash"
  | "/wallet/buy/crypto"
  | "/wallet/buy/input"
  | "/wallet/deposit"
  | "/wallet/buy/success";

export const EmbeddedPaths = {
  // TODO: Consider nesting these instead:

  // Support:
  SupportUnpartitionedStateMissing: "/support/unpartitioned-state",

  // Authentication:
  Auth: "/auth",
  AuthEmailOtp: "/auth/otp",
  AuthEmailSignInPassword: "/auth/email-signin/password",
  AuthEmailVerify: "/auth/email-verify",
  AuthMoreProviders: "/auth/more-providers",
  AuthAddWallet: "/auth/add-wallet",
  AuthImportWallet: "/auth/import-wallet",
  AuthImportSeedPhrase: "/auth/import-seedphrase",
  AuthImportKeyfile: "/auth/import-keyfile",
  AuthImportQrCode: "/auth/import-qrcode",

  // Authentication Linking:
  AuthAddDevice: "/auth/add-device",
  AuthAddAuthProvider: "/auth/add-auth-provider",
  AuthAddWithQRCode: "/auth/add-qrcode",
  AuthQRCodeScanner: "/auth/qrcode-scanner",

  // Shares Recovery:
  AuthRestoreShares: "/auth/restore-shares",
  AuthRestoreSharesCreateConfirmation: "/auth/restore-shares/create-confirmation",
  AuthRestoreSharesRecoveryFile: "/auth/restore-shares/recovery-file",
  AuthRestoreSharesSeedPhrase: "/auth/restore-shares/seedphrase",
  AuthRestoreSharesKeyfile: "/auth/restore-shares/keyfile",
  AuthRestoreSharesQrCode: "/auth/restore-shares/qrcode",

  // Account Recovery:
  AuthRecoverAccount: "/auth/recover-account",
  AuthRecoverAccountOtp: "/auth/recover-account/otp",
  AuthRecoverAccountSeedphrase: "/auth/recover-account/seedphrase",
  AuthRecoverAccountKeyfile: "/auth/recover-account/keyfile",
  AuthRecoverAccountQrCode: "/auth/recover-account/qrcode",
  AuthRecoverAccountSelect: "/auth/recover-account/select",
  AuthRecoverAccountConfirm: "/auth/recover-account/confirm",

  // Account Management:
  AccountChangePassword: "/account/change-password",

  // Account Wallets:
  AccountAddWallet: "/account/add-wallet",
  AccountImportSeedphrase: "/account/import-seedphrase",
  AccountImportKeyfile: "/account/import-keyfile",

  // Account Backup:
  AccountBackupWallet: "/account/backup-wallet",
  AccountBackupFullWallet: "/account/backup-wallet/full",
  AccountBackupCopySeedphrase: "/account/backup-wallet/copy-seedphrase",
  AccountBackupWalletRecoveryFile: "/account/backup-wallet/recovery-file",
  AccountBackupWalletQrCode: "/account/backup-wallet/qrcode",
  AccountBackupCloud: "/account/backup-wallet/cloud",
  AccountBackupCloudChangeProvider: "/account/backup-wallet/cloud/change-provider",
  AccountBackupCloudImport: "/account/backup-wallet/cloud/import",
  AccountBackupCloudImportSuccess: "/account/backup-wallet/cloud/import-success",
  AccountCongratulations: "/account/congratulations",
  AccountExportWallet: "/account/export-wallet",

  // Wallet:
  WalletHomeEmbeddedView: "/",
  WalletReceiveEmbeddedView: "/wallet/receive",
  WalletReceiveOptionsEmbeddedView: "/wallet/receive/options",
  WalletTransactionsEmbeddedView: "/wallet/transactions",
  WalletTransactionsHistoryEmbeddedView: "/wallet/transactions-history",
  WalletTransactionCompleteEmbeddedView: "/wallet/transaction-complete/:id",
  WalletBuyEmbeddedView: "/wallet/buy",
  WalletBuyCashEmbeddedView: "/wallet/buy/cash",
  WalletDepositTokensEmbeddedView: "/wallet/deposit",
  WalletBuyInputEmbeddedView: "/wallet/buy/crypto",
  WalletBuySuccessEmbeddedView: "/wallet/buy/success",

  // TODO: Add pages to add/link additional auth methods or devices post-auth (under /account)
} as const satisfies Record<string, EmbeddedRoutePath>;

const IFRAME_OWN_ROUTES = [
  // Support:

  {
    path: EmbeddedPaths.SupportUnpartitionedStateMissing,
    component: UnpartitionedStateMissingEmbeddedView,
  },

  // Authentication:

  {
    path: EmbeddedPaths.Auth,
    component: AuthEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthEmailOtp,
    component: AuthEmailOtpEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthEmailSignInPassword,
    component: AuthEmailSignInPasswordEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthEmailVerify,
    component: AuthEmailVerifyEmbeddedView,
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
    path: EmbeddedPaths.AuthImportWallet,
    component: AuthImportWalletEmbeddedView,
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
    path: EmbeddedPaths.AuthImportQrCode,
    component: AuthImportQrCodeEmbeddedView,
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

  // Shares Recovery:

  {
    path: EmbeddedPaths.AuthRestoreShares,
    component: AuthRestoreSharesEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRestoreSharesCreateConfirmation,
    component: AuthRestoreSharesCreateConfirmationEmbeddedView,
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
  {
    path: EmbeddedPaths.AuthRestoreSharesQrCode,
    component: AuthRestoreSharesQrCodeEmbeddedView,
  },

  // Account Recovery:

  {
    path: EmbeddedPaths.AuthRecoverAccount,
    component: AuthRecoverAccountEmbeddedView,
  },
  {
    path: EmbeddedPaths.AuthRecoverAccountOtp,
    component: AuthRecoverAccountOtpEmbeddedView,
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
    path: EmbeddedPaths.AuthRecoverAccountQrCode,
    component: AuthRecoverAccountQrCodeEmbeddedView,
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
    path: EmbeddedPaths.AccountChangePassword,
    component: AccountChangePasswordEmbeddedView,
  },

  // Account Wallets:

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

  // Account Backup:

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
    path: EmbeddedPaths.AccountBackupWalletQrCode,
    component: AccountBackupWalletQrCodeEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountExportWallet,
    component: AccountExportWalletEmbeddedView,
  },

  // Wallet:
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

  // Account Backup Cloud:
  {
    path: EmbeddedPaths.AccountBackupCloud,
    component: AccountBackupCloudEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupCloudChangeProvider,
    component: AccountBackupCloudChangeProviderEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupCloudImport,
    component: AccountBackupCloudImportEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountCongratulations,
    component: CongratulationsEmbeddedView,
  },
  {
    path: EmbeddedPaths.AccountBackupCloudImportSuccess,
    component: AccountBackupCloudImportSuccessEmbeddedView,
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

  // auth.tsx:
  ...CONNECT_AUTH_ROUTES.filter((route) => !isRouteOverride(route.path)),

  // Embedded wallet only:
  ...IFRAME_OWN_ROUTES,
] as const satisfies RouteConfig[];
