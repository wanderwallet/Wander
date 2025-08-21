import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useAuthRequests } from "~utils/auth/auth.hooks";
import { NOOP } from "~utils/misc";
import type { AuthRoutePath } from "~wallets/router/auth/auth.routes";
import { useExtensionStatusOverride } from "~wallets/router/extension/extension-router.hook";
import { ExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { BaseLocationHook } from "~wallets/router/router.types";
import { useHashLocation } from "wouter/use-hash-location";
import { routeTrapInside, routeTrapOutside } from "../router.utils";
import { useEffect } from "react";
import { AUTH_POPUP_REQUEST_WAIT_MS } from "~utils/auth/auth.constants";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const override = useExtensionStatusOverride();
  const { authRequest: currentAuthRequest, closeAuthPopup } = useCurrentAuthRequest("any");
  const { authRequests, setCurrentAuthRequestIndex } = useAuthRequests();
  const [wocation, wavigate] = useHashLocation();

  useEffect(() => {
    if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1" || currentAuthRequest || override) return;

    // Only for BE, if there's no `currentAuthRequest` and no `override`, close the popup:
    return closeAuthPopup(AUTH_POPUP_REQUEST_WAIT_MS);
  }, [currentAuthRequest, override]);

  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1" && !currentAuthRequest) {
    // For Connect, we won't be calling `window.close()` in `auth.provider.ts`. Instead, we just redirect the user back
    // to the wallet home once all auth requests are handled:

    // TODO: Update this to take users back to wherever they were before they were interrupted by the auth request.

    const override = routeTrapOutside(wocation as AuthRoutePath, "/auth-request", EmbeddedPaths.WalletHomeEmbeddedView);

    return override ? [override, wavigate] : [null, NOOP];
  }

  if (import.meta.env?.VITE_IS_EMBEDDED_APP !== "1") {
    // For BE, we might have to wait for the wallet to initialize:
    if (override) return [override, NOOP];

    // Also, we might have to wait for popup window to receive the AuthRequest. Note this can't happen in Connect,
    // because everything runs in the same window/app:
    if (!currentAuthRequest) return [ExtensionOverrides.Loading, NOOP];
  }

  // The authID has been added to the URL so that the auto-scroll and view transition effect work when switching
  // between different `AuthRequest`s of the same type:
  const location = `/auth-request/${currentAuthRequest.type}/${currentAuthRequest.authID}` satisfies AuthRoutePath;

  // navigate function that can handle both auth request navigation and related routes
  const navigate = (to: string, options?: any) => {
    if (!to) return;

    to = to.replace("#", "");

    // Check if the path contains an authID
    const authIDMatch = to.match(/\/auth-request\/[^\/]+\/([^\/]+)/);

    if (authIDMatch && authIDMatch[1]) {
      const authID = authIDMatch[1];

      // Find the auth request with this ID:
      const index = authRequests.findIndex((request) => request.authID === authID);

      if (index !== -1) {
        setCurrentAuthRequestIndex(index);
      }
    }

    wavigate(to, options);
  };

  // TODO: Once we change the routing library, there should not be differences like this between different apps. This
  // one happens because:
  //
  // - Connect can handle __REDIRECT/... and will make the URL match the current route.
  //
  // - BE cannot handle __REDIRECT/... and won't make the URL match the current route. The auth popup's path will always
  //   be /, regardless of the `location` value returned below.

  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
    const locationOverride = routeTrapInside(wocation as AuthRoutePath, location);

    return [locationOverride || (wocation as AuthRoutePath), navigate];
  }

  return [location, navigate];
};
