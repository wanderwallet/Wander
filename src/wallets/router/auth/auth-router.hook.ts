import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useAuthRequests } from "~utils/auth/auth.hooks";
import { NOOP } from "~utils/misc";
import type { AuthRoutePath } from "~wallets/router/auth/auth.routes";
import { useExtensionStatusOverride } from "~wallets/router/extension/extension-router.hook";
import { ExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { BaseLocationHook } from "~wallets/router/router.types";
import { useHashLocation } from "wouter/use-hash-location";
import { EmbeddedPaths } from "../iframe/iframe.routes";
import { routeTrapMatches } from "../router.utils";

const AuthRelatedScreenRoutes = [
  EmbeddedPaths.WalletPermissionsRequestEmbeddedView,
  EmbeddedPaths.WalletSettingsCustomEmbeddedView,
  EmbeddedPaths.WalletTransactionDetailsEmbeddedView
];

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const override = useExtensionStatusOverride();
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");
  const { authRequests, setCurrentAuthRequestIndex } = useAuthRequests();
  const [wocation, wavigate] = useHashLocation();

  if (override && import.meta.env?.VITE_IS_EMBEDDED_APP !== "1")
    return [override, NOOP];

  if (!currentAuthRequest) return [ExtensionOverrides.Loading, NOOP];

  // The authID has been added to the URL so that the auto-scroll and view transition effect work when switching
  // between different `AuthRequest`s of the same type:
  const location =
    `/auth-request/${currentAuthRequest.type}/${currentAuthRequest.authID}` satisfies AuthRoutePath;

  // navigate function that can handle both auth request navigation and related routes
  const navigate = (to: string, options?: any) => {
    if (!to) return;
    to = to.replace("#", "");

    // Check if the path contains an authID
    const authIDMatch = to.match(/\/auth-request\/[^\/]+\/([^\/]+)/);
    if (authIDMatch && authIDMatch[1]) {
      const authID = authIDMatch[1];
      // Find the auth request with this ID
      const index = authRequests.findIndex(
        (request) => request.authID === authID
      );
      if (index !== -1) {
        setCurrentAuthRequestIndex(index);
        return;
      }
    }

    // For other paths, use the regular hash location navigation
    wavigate(to, options);
  };

  const matchedLocation = routeTrapMatches(
    wocation as AuthRoutePath,
    AuthRelatedScreenRoutes,
    location
  );

  return [matchedLocation, navigate];
};
