import { useHashLocation } from "wouter/use-hash-location";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import type { AuthStatus } from "~utils/embedded/embedded.types";
import { NOOP } from "~utils/misc";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import type { ExtensionRouteOverride } from "~wallets/router/extension/extension.routes";
import {
  EmbeddedPaths,
  type EmbeddedRoutePath
} from "~wallets/router/iframe/iframe.routes";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type {
  WanderRoutePath,
  BaseLocationHook,
  RoutePath,
  RouteRedirect
} from "~wallets/router/router.types";
import {
  isRouteOverride,
  isRouteRedirect,
  routeTrapInside,
  routeTrapMatches,
  routeTrapOutside,
  withRouterRedirects
} from "~wallets/router/router.utils";

const AUTH_STATUS_TO_OVERRIDE: Record<
  AuthStatus,
  null | ExtensionRouteOverride
> = {
  // TODO: Redefine these override paths:
  unknown: "/__OVERRIDES/cover",
  authLoading: null,
  authError: null,
  noAuth: null,
  noWallets: null,
  noShares: null,
  loading: "/__OVERRIDES/loading",
  locked: "/__OVERRIDES/unlock",
  unlocked: null
};

export function useAuthStatusOverride(
  location?: RoutePath
): null | ExtensionRouteOverride | RouteRedirect<WanderRoutePath> {
  const { authStatus, lastRegisteredWallet, promptToBackUp } = useEmbedded();

  // TODO: Memo all  this:

  if (authStatus === "unknown" && location !== "/__OVERRIDES/cover") {
    return "/__REDIRECT/";
  }

  if (location) {
    if (authStatus === "noAuth" || authStatus === "authLoading") {
      return routeTrapMatches(
        location,
        [
          EmbeddedPaths.Auth,
          EmbeddedPaths.AuthMoreProviders,
          // TODO: These could be simply "anything under  AuthRecoverAccount"
          EmbeddedPaths.AuthRecoverAccount,
          EmbeddedPaths.AuthRecoverAccountSeedphrase,
          EmbeddedPaths.AuthRecoverAccountKeyfile,
          EmbeddedPaths.AuthRecoverAccountAuthentication,
          EmbeddedPaths.AuthRecoverAccountMoreAuthentication
        ],
        EmbeddedPaths.Auth
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
          EmbeddedPaths.AuthImportKeyfile,
          EmbeddedPaths.AuthAddDevice,
          EmbeddedPaths.AuthAddAuthProvider
          // EmbeddedPaths.AddDevice/<SOMETHING>
          // EmbeddedPaths.AddAuthProvider/<SOMETHING>
        ],
        EmbeddedPaths.AuthAddWallet
      );
    }

    if (authStatus === "noShares") {
      return routeTrapMatches(
        location,
        // TODO: Do we allow simply generating a new wallet? EmbeddedPaths.AuthAddWallet
        [
          EmbeddedPaths.AuthRestoreShares,
          EmbeddedPaths.AuthRestoreSharesRecoveryFile
        ],
        EmbeddedPaths.AuthRestoreShares
      );
    }

    if (authStatus === "unlocked") {
      if (lastRegisteredWallet) {
        // If an account or wallet has just been created, then show AuthAddWalletConfirmation:
        return routeTrapMatches(
          location,
          [EmbeddedPaths.AccountConfirmation],
          EmbeddedPaths.AccountConfirmation
        );
      }

      if (promptToBackUp) {
        return routeTrapMatches(
          location,
          [
            EmbeddedPaths.AccountBackupSharesReminder,
            EmbeddedPaths.AccountBackupShares
            // TODO: Missing EmbeddedPaths.AccountBackupShares/<PROVIDER>
          ],
          EmbeddedPaths.AccountBackupSharesReminder
        );
      }

      // TODO: What if we are here but the wallet, for whatever reason, is not in the wallet provider / ExtensionStore?
      // TODO: We need a routeOffLimits to keep users away from /auth after they authenticate (except for confirmation screen while it has location state data)

      return routeTrapOutside(location, EmbeddedPaths.Auth, PopupPaths.Home);
    }
  }

  return AUTH_STATUS_TO_OVERRIDE[authStatus];
}

export const useEmbeddedLocation: BaseLocationHook = withRouterRedirects(() => {
  const [wocation, wavigate] = useHashLocation();
  const override = useAuthStatusOverride(wocation as RoutePath);
  // const override = useAuthStatusOverride();
  const [authRequestsLocation, authRequestsNavigate] =
    useAuthRequestsLocation();

  if (override) {
    return [override, isRouteRedirect(override) ? wavigate : NOOP];
  }

  if (authRequestsLocation && !isRouteOverride(authRequestsLocation)) {
    return [authRequestsLocation, authRequestsNavigate];
  }

  return [wocation as WanderRoutePath, wavigate];
});
