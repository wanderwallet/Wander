import { useHashLocation } from "wouter/use-hash-location";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import type { AuthStatus } from "~utils/embedded/embedded.types";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import type { ExtensionRouteOverride } from "~wallets/router/extension/extension.routes";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import type { WanderRoutePath, BaseLocationHook, RoutePath } from "~wallets/router/router.types";
import { isRouteOverride, routeTrapMatches, routeTrapOutside, withRouterRedirects } from "~wallets/router/router.utils";
import { EMBEDDED_SKIP_STORAGE_ACCESS_WARNING } from "~utils/embedded/iframe.utils";

const AUTH_STATUS_TO_OVERRIDE: Record<AuthStatus, null | ExtensionRouteOverride> = {
  // TODO: Redefine these override paths:
  unknown: "/__OVERRIDES/cover",
  authLoading: null,
  authError: null,
  noAuth: null,
  noWallets: null,
  noShares: null,
  loading: "/__OVERRIDES/loading",
  locked: "/__OVERRIDES/unlock",
  unlocked: null,
};

export function useEmbeddedOverride(location?: RoutePath) {
  const {
    authStatus,
    currentWallet,
    recoverableAccount,
    requestPasswordChange,
    unpartitionedStateStatus,
    unpartitionedStateConfirmed,
    lastRegisteredWallet,
  } = useEmbedded();

  if (!location || authStatus === "unknown") {
    return "/__OVERRIDES/cover";
  }

  if (
    !EMBEDDED_SKIP_STORAGE_ACCESS_WARNING &&
    unpartitionedStateStatus !== "supported" &&
    !unpartitionedStateConfirmed &&
    authStatus === "noAuth"
  ) {
    return routeTrapMatches(
      location,
      [EmbeddedPaths.SupportUnpartitionedStateMissing],
      EmbeddedPaths.SupportUnpartitionedStateMissing,
    );
  }

  // Always allowed to go here:
  if (unpartitionedStateStatus !== "supported" && location === EmbeddedPaths.SupportUnpartitionedStateMissing) return;

  if (authStatus === "noAuth" || authStatus === "authLoading" || authStatus === "authError") {
    return routeTrapMatches(
      location,
      [
        EmbeddedPaths.Auth,
        EmbeddedPaths.AuthEmailOtp,
        EmbeddedPaths.AuthEmailSignInPassword,
        EmbeddedPaths.AuthEmailVerify,
        EmbeddedPaths.AuthMoreProviders,
        // TODO: These could be simply "anything under  AuthRecoverAccount"
        EmbeddedPaths.AuthRecoverAccount,
        EmbeddedPaths.AuthRecoverAccountOtp,
        EmbeddedPaths.AuthRecoverAccountSeedphrase,
        EmbeddedPaths.AuthRecoverAccountKeyfile,
        EmbeddedPaths.AuthRecoverAccountQrCode,
        EmbeddedPaths.AuthRecoverAccountSelect,
      ],
      EmbeddedPaths.Auth,
    );
  }

  if ((authStatus === "noWallets" || authStatus === "noShares") && recoverableAccount) {
    return routeTrapMatches(
      location,
      [EmbeddedPaths.AuthRecoverAccountConfirm],
      EmbeddedPaths.AuthRecoverAccountConfirm,
    );
  }

  if (authStatus === "noWallets") {
    return routeTrapMatches(
      location,
      [
        EmbeddedPaths.AuthAddWallet,
        EmbeddedPaths.AuthImportWallet,
        EmbeddedPaths.AuthImportSeedPhrase,
        EmbeddedPaths.AuthAddWithQRCode,
        EmbeddedPaths.AuthQRCodeScanner,
        EmbeddedPaths.AuthImportKeyfile,
        EmbeddedPaths.AuthImportQrCode,
        EmbeddedPaths.AuthAddDevice,
        EmbeddedPaths.AuthAddAuthProvider,
        // EmbeddedPaths.AddDevice/<SOMETHING>
        // EmbeddedPaths.AddAuthProvider/<SOMETHING>
      ],
      EmbeddedPaths.AuthAddWallet,
    );
  }

  if (authStatus === "noShares") {
    const hasCloudBackup = currentWallet.totalCloudBackups > 0;
    const redirectTo = hasCloudBackup ? EmbeddedPaths.AccountBackupCloudImport : EmbeddedPaths.AuthRestoreShares;

    const validRoutes = [
      // Restore:
      EmbeddedPaths.AuthRestoreShares,
      EmbeddedPaths.AuthRestoreSharesCreateConfirmation,
      EmbeddedPaths.AuthRestoreSharesRecoveryFile,
      EmbeddedPaths.AuthRestoreSharesSeedPhrase,
      EmbeddedPaths.AuthRestoreSharesKeyfile,
      EmbeddedPaths.AuthRestoreSharesQrCode,

      // Add wallet:
      EmbeddedPaths.AuthAddWallet,
      EmbeddedPaths.AuthImportWallet,
      EmbeddedPaths.AuthImportSeedPhrase,
      EmbeddedPaths.AuthAddWithQRCode,
      EmbeddedPaths.AuthQRCodeScanner,
      EmbeddedPaths.AuthImportKeyfile,
      EmbeddedPaths.AuthImportQrCode,
    ] as RoutePath[];

    if (hasCloudBackup) {
      validRoutes.unshift(EmbeddedPaths.AccountBackupCloudImportSuccess);
      validRoutes.unshift(EmbeddedPaths.AccountBackupCloudImport);
    }

    return routeTrapMatches(location, validRoutes, redirectTo);
  }

  if (authStatus === "unlocked") {
    // Show cloud backup screen for first-time wallet creation/import
    if (lastRegisteredWallet && currentWallet.totalCloudBackups === 0) {
      return routeTrapMatches(
        location,
        [
          EmbeddedPaths.AccountBackupCloud,
          EmbeddedPaths.AccountBackupCloudChangeProvider,
          EmbeddedPaths.AccountCongratulations,
        ],
        EmbeddedPaths.AccountBackupCloud,
      );
    }

    if (requestPasswordChange) {
      // TODO: Consider also including this as a box in the dashboard?
      return routeTrapMatches(location, [EmbeddedPaths.AccountChangePassword], EmbeddedPaths.AccountChangePassword);
    }

    // TODO: What if we are here but the wallet, for whatever reason, is not in the wallet provider / ExtensionStore?
    // if (!currentWallet.isActive)

    return routeTrapOutside(location, EmbeddedPaths.Auth, EmbeddedPaths.WalletHomeEmbeddedView);
  }

  return AUTH_STATUS_TO_OVERRIDE[authStatus];
}

// TODO: Memo all this:

export const useEmbeddedLocation: BaseLocationHook = withRouterRedirects(() => {
  const [wocation, wavigate] = useHashLocation();

  const override = useEmbeddedOverride(wocation as RoutePath);

  const [authRequestsLocation, authRequestsNavigate] = useAuthRequestsLocation();

  if (override) {
    // return [override, isRouteRedirect(override) ? wavigate : NOOP];
    return [override, wavigate];
  }

  if (authRequestsLocation && !isRouteOverride(authRequestsLocation)) {
    return [authRequestsLocation, authRequestsNavigate];
  }

  return [wocation as WanderRoutePath, wavigate];
});
