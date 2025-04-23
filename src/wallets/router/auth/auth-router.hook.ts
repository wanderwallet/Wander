import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useAuthRequests } from "~utils/auth/auth.hooks";
import { NOOP } from "~utils/misc";
import type { AuthRoutePath } from "~wallets/router/auth/auth.routes";
import { useExtensionStatusOverride } from "~wallets/router/extension/extension-router.hook";
import { ExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { BaseLocationHook, RoutePath } from "~wallets/router/router.types";
import { useHashLocation } from "wouter/use-hash-location";
import {
  routeTrapInside,
  routeTrapMatches,
  withRouterRedirects
} from "../router.utils";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { useEffect } from "react";
import { AUTH_POPUP_REQUEST_WAIT_MS } from "~utils/auth/auth.constants";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

// TODO: Use the EmbeddedPaths instead but should we create the same hook for wander connect?
/*
const AuthRelatedScreenRoutes = [
  EmbeddedPaths.WalletPermissionsRequestEmbeddedView,
  //"/wallet/settings",
  EmbeddedPaths.WalletSettingsCustomEmbeddedView,
  //"/wallet/settings/custom",
  EmbeddedPaths.WalletTransactionDetailsEmbeddedView,
  //"/wallet/transaction-details"
] as RoutePath[];
 */

export const useAuthRequestsLocation: BaseLocationHook = withRouterRedirects(
  () => {
    const override = useExtensionStatusOverride();
    const { authRequest: currentAuthRequest, closeAuthPopup } =
      useCurrentAuthRequest("any");
    const { authRequests, setCurrentAuthRequestIndex } = useAuthRequests();
    const [wocation, wavigate] = useHashLocation();

    useEffect(() => {
      // if (IS_EMBEDDED_APP || currentAuthRequest || override) return;

      // return closeAuthPopup(AUTH_POPUP_REQUEST_WAIT_MS);

      console.log("closeAuthPopup");
    }, [currentAuthRequest, override]);

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

      console.log("to =", to);

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

    const matchedLocation = routeTrapInside(
      wocation as AuthRoutePath,
      location
    );

    console.log("matchedLocation =", { wocation, location, matchedLocation });

    return [matchedLocation, navigate];
  }
);
