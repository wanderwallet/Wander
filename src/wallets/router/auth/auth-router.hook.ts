import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { NOOP } from "~utils/misc";
import type { AuthRoutePath } from "~wallets/router/auth/auth.routes";
import { useExtensionStatusOverride } from "~wallets/router/extension/extension-router.hook";
import { ExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { BaseLocationHook } from "~wallets/router/router.types";

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const override = useExtensionStatusOverride();
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");

  if (override) return [override, NOOP];

  if (!currentAuthRequest) return [ExtensionOverrides.Loading, NOOP];

  // The authID has been added to the URL so that the auto-scroll and view transition effect work when switching
  // between different `AuthRequest`s of the same type:
  const location =
    `/auth-request/${currentAuthRequest.type}/${currentAuthRequest.authID}` satisfies AuthRoutePath;

  // TODO: Implement a navigate function that selects a different AuthRequest and also use <Link> whenever possible:
  return [location, (authID: string) => {}];
};
