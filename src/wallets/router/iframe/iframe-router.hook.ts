import { useHashLocation } from "wouter/use-hash-location";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import type { AuthStatus } from "~utils/embedded/embedded.types";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import type { ExtensionRouteOverride } from "~wallets/router/extension/extension.routes";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import type { WanderRoutePath, BaseLocationHook, RoutePath } from "~wallets/router/router.types";
import { isRouteOverride, routeTrapMatches, routeTrapOutside, withRouterRedirects } from "~wallets/router/router.utils";

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
  const { authStatus, currentWallet, recoverableAccount, requestPasswordChange } = useEmbedded();

  if (!location || authStatus === "unknown") {
    return "/__OVERRIDES/cover";
  }

  if (authStatus === "noAuth" || authStatus === "authLoading" || authStatus === "authError") {
    return routeTrapMatches(
      location,
      [
        EmbeddedPaths.Auth,
        EmbeddedPaths.AuthEmailSignup,
        EmbeddedPaths.AuthEmailVerify,
        EmbeddedPaths.AuthEmailSignin,
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
    return routeTrapMatches(
      location,
      [
        // Restore:
        EmbeddedPaths.AuthRestoreShares,
        EmbeddedPaths.AuthRestoreSharesCreateConfirmation,
        EmbeddedPaths.AuthRestoreSharesRecoveryFile,
        EmbeddedPaths.AuthRestoreSharesSeedPhrase,
        EmbeddedPaths.AuthRestoreSharesKeyfile,
        EmbeddedPaths.AuthRestoreSharesQrCode,

        // Add wallet:
        EmbeddedPaths.AuthAddWallet,
        EmbeddedPaths.AuthImportSeedPhrase,
        EmbeddedPaths.AuthAddWithQRCode,
        EmbeddedPaths.AuthQRCodeScanner,
        EmbeddedPaths.AuthImportKeyfile,
        EmbeddedPaths.AuthImportQrCode,
      ],
      EmbeddedPaths.AuthRestoreShares,
    );
  }

  if (authStatus === "unlocked") {
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
