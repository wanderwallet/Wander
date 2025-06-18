import { useHashLocation } from "wouter/use-hash-location";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import type { AuthStatus } from "~utils/embedded/embedded.types";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import type { ExtensionRouteOverride } from "~wallets/router/extension/extension.routes";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import type { WanderRoutePath, BaseLocationHook, RoutePath } from "~wallets/router/router.types";
import {
  isRouteOverride,
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

export function useEmbeddedOverride(location?: RoutePath) {
  const { authStatus, lastRegisteredWallet, currentWallet, recoverableAccount } = useEmbedded();

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
      // TODO: Do we allow simply generating a new wallet? EmbeddedPaths.AuthAddWallet
      [
        EmbeddedPaths.AuthRestoreShares,
        EmbeddedPaths.AuthRestoreSharesRecoveryFile,
        EmbeddedPaths.AuthRestoreSharesSeedPhrase,
        EmbeddedPaths.AuthRestoreSharesKeyfile,
        EmbeddedPaths.AuthRestoreSharesQrCode,
      ],
      EmbeddedPaths.AuthRestoreShares,
    );
  }

  if (authStatus === "unlocked") {
    if (lastRegisteredWallet) {
      // TODO: Remove this unnecessary step and just include a confirmation in the dashboard.
      // If an account or wallet has just been created, then show AuthAddWalletConfirmation:
      return routeTrapMatches(location, [EmbeddedPaths.AccountConfirmation], EmbeddedPaths.AccountConfirmation);
    }

    // TODO: Make recovery mandatory if no unpartitioned storage support, or optional if it has (because it will be hard to find the original site they were they first created a wallet).
    // TODO: Once we support multiple wallets, the condition here should instead check if ANY of the wallets hasn't been backed up yet:
    if (currentWallet.totalExports === 0 && currentWallet.totalBackups === 0 && !currentWallet.doNotAskAgainSetting) {
      return routeTrapMatches(
        location,
        [
          EmbeddedPaths.AccountBackupWalletReminder,
          EmbeddedPaths.AccountBackupWallet,
          EmbeddedPaths.AccountBackupFullWallet,
          EmbeddedPaths.AccountBackupWalletRecoveryFile,
          EmbeddedPaths.AccountBackupCopySeedphrase,
          EmbeddedPaths.AccountBackupWalletQrCode,
          // TODO: Missing EmbeddedPaths.AccountBackupShares/<PROVIDER>
        ],
        EmbeddedPaths.AccountBackupWalletReminder,
      );
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
