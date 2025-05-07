import { useHashLocation } from "wouter/use-hash-location";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import type { AuthStatus, Wallet } from "~utils/embedded/embedded.types";
import { NOOP } from "~utils/misc";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import type { ExtensionRouteOverride } from "~wallets/router/extension/extension.routes";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { WanderRoutePath, BaseLocationHook, RoutePath, RouteRedirect } from "~wallets/router/router.types";
import {
  isRouteOverride,
  isRouteRedirect,
  routeTrapMatches,
  routeTrapOutside,
  useSearchParams,
  withRouterRedirects,
} from "~wallets/router/router.utils";

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

export function useEmbeddedOverride(
  location?: RoutePath,
): null | ExtensionRouteOverride | RouteRedirect<WanderRoutePath> {
  const { authStatus, lastRegisteredWallet, currentWallet } = useEmbedded();
  const searchParams = useSearchParams<{
    error?: string;
    error_description?: string;
  }>();

  // Handle OAuth redirect error URL from Supabase
  if (searchParams.error && searchParams.error_description) {
    // Supabase redirects with error parameters in the URL when OAuth fails
    // Example: #error=server_error&error_description=OAuth+provider+error
    return routeTrapMatches(location, [EmbeddedPaths.AuthError], EmbeddedPaths.AuthError);
  }

  if (!location || location.startsWith("/access_token") || authStatus === "unknown") {
    return "/__OVERRIDES/cover";
  }

  if (location) {
    if (authStatus === "noAuth" || authStatus === "authLoading") {
      return routeTrapMatches(
        location,
        [
          EmbeddedPaths.Auth,
          EmbeddedPaths.AuthEmailSignup,
          EmbeddedPaths.AuthEmailVerify,
          EmbeddedPaths.AuthEmailSignin,
          EmbeddedPaths.AuthMoreProviders,
          EmbeddedPaths.AuthAddWithQRCode,
          // TODO: These could be simply "anything under  AuthRecoverAccount"
          EmbeddedPaths.AuthRecoverAccount,
          EmbeddedPaths.AuthRecoverAccountSeedphrase,
          EmbeddedPaths.AuthRecoverAccountKeyfile,
          EmbeddedPaths.AuthRecoverAccountAuthentication,
          EmbeddedPaths.AuthRecoverAccountMoreAuthentication,
        ],
        EmbeddedPaths.Auth,
      );
    }

    if (authStatus === "authError") {
      // TODO: Implement logic/screen for this:
      throw new Error("Not implemented");
    }

    if (authStatus === "noWallets") {
      return routeTrapMatches(
        location,
        [
          EmbeddedPaths.AuthAddWallet,
          EmbeddedPaths.AuthImportSeedPhrase,
          EmbeddedPaths.AuthAddWithQRCode,
          EmbeddedPaths.AuthQRCodeScanner,
          EmbeddedPaths.AuthImportKeyfile,
          EmbeddedPaths.AuthAddDevice,
          EmbeddedPaths.AuthAddAuthProvider,
          // EmbeddedPaths.AddDevice/<SOMETHING>
          // EmbeddedPaths.AddAuthProvider/<SOMETHING>
        ],
        EmbeddedPaths.AuthAddWallet,
      );
    }

    if (authStatus === "noShares") {
      return routeTrapMatches(
        location,
        // TODO: Do we allow simply generating a new wallet? EmbeddedPaths.AuthAddWallet
        [
          EmbeddedPaths.AuthRestoreShares,
          EmbeddedPaths.AuthRestoreSharesRecoveryFile,
          EmbeddedPaths.AuthImportSeedPhrase,
          EmbeddedPaths.AuthImportKeyfile,
        ],
        EmbeddedPaths.AuthRestoreShares,
      );
    }

    if (authStatus === "unlocked") {
      if (lastRegisteredWallet) {
        // If an account or wallet has just been created, then show AuthAddWalletConfirmation:
        return routeTrapMatches(location, [EmbeddedPaths.AccountConfirmation], EmbeddedPaths.AccountConfirmation);
      }

      if (currentWallet.totalExports === 0 && currentWallet.totalBackups === 0 && !currentWallet.doNotAskAgainSetting) {
        return routeTrapMatches(
          location,
          [
            EmbeddedPaths.AccountBackupWalletReminder,
            EmbeddedPaths.AccountBackupWallet,
            EmbeddedPaths.AccountBackupFullWallet,
            EmbeddedPaths.AccountBackupWalletRecoveryFile,
            EmbeddedPaths.AccountBackupCopySeedphrase,
            // TODO: Missing EmbeddedPaths.AccountBackupShares/<PROVIDER>
          ],
          EmbeddedPaths.AccountBackupWalletReminder,
        );
      }

      // TODO: What if we are here but the wallet, for whatever reason, is not in the wallet provider / ExtensionStore?
      // if (!currentWallet.isActive)

      return routeTrapOutside(location, EmbeddedPaths.Auth, EmbeddedPaths.WalletHomeEmbeddedView);
    }
  }

  return AUTH_STATUS_TO_OVERRIDE[authStatus];
}

// TODO: Memo all this:

export const useEmbeddedLocation: BaseLocationHook = withRouterRedirects(() => {
  const [wocation, wavigate] = useHashLocation();

  const override = useEmbeddedOverride(wocation as RoutePath);

  const [authRequestsLocation, authRequestsNavigate] = useAuthRequestsLocation();

  if (override) {
    return [override, isRouteRedirect(override) ? wavigate : NOOP];
  }

  if (authRequestsLocation && !isRouteOverride(authRequestsLocation)) {
    return [authRequestsLocation, authRequestsNavigate];
  }

  return [wocation as WanderRoutePath, wavigate];
});
