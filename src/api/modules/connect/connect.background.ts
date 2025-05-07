import { isAppInfo, isGateway, isNotEmptyArray, isPermissionsArray } from "~utils/assertions";
import { getMissingPermissions } from "~applications/permissions";
import { createContextMenus } from "~utils/context_menus";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { updateIcon } from "~utils/icon";
import Application from "~applications/application";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import { getActiveAddress, getWallets, openOrSelectWelcomePage } from "~wallets";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { ERR_MSG_NO_WALLETS_ADDED } from "~utils/auth/auth.constants";

const background: BackgroundModuleFunction<void> = async (
  appData,
  permissions: unknown,
  appInfo: unknown = {},
  gateway?: unknown,
) => {
  // validate input
  isNotEmptyArray(permissions);
  isPermissionsArray(permissions);
  isAppInfo(appInfo);

  if (gateway) isGateway(gateway);

  // While `requestUserAuthorization` (actually `createAuthPopup`) already does this check below, opening the Welcome
  // page and throwing a "No wallets added" error if there are no wallets, we still need to check here, particularly for
  // Embed, as the user could have connected to a dApp before, but might not be authenticated right now. In that case,
  // there are no wallets or active address, but the app permissions are still stored in localStorage, so without this
  // checks here, this function will return normally in the early return a few lines below.

  const [activeAddress, wallets] = await Promise.all([getActiveAddress(), getWallets()]);

  const hasWallets = activeAddress && wallets.length > 0;

  if (!hasWallets) {
    if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1") {
      postEmbeddedMessage({
        type: "embedded_open",
        data: null,
      });
    } else {
      openOrSelectWelcomePage(true);
    }

    throw new Error(ERR_MSG_NO_WALLETS_ADDED);
  }

  // get permissions
  const app = new Application(appData.url);
  const existingPermissions = await app.getPermissions();

  // compare existing permissions
  if (existingPermissions) {
    // the permissions the dApp does not have yet
    const requiredPermissions = getMissingPermissions(existingPermissions, permissions);

    // check if all requested permissions are available for the app
    // if yes, we don't do anything
    if (requiredPermissions.length === 0) return;
  }

  // add app logo if there isn't one
  if (!appInfo.logo) {
    appInfo.logo = appData.favicon;
  }

  try {
    // authenticate the user with the requested permissions
    await requestUserAuthorization(
      {
        type: "connect",
        permissions,
        appInfo,
        gateway,
      },
      appData,
    );

    // add features available after connection
    await updateIcon(true);
    createContextMenus(true);
  } catch (err) {
    await updateIcon(false);
    createContextMenus(false);

    // TODO: Replacing this with `throw err` produces better stack traces:
    throw new Error(err);
  }
};

export default background;
