import {
  isAppInfo,
  isGateway,
  isNotEmptyArray,
  isPermissionsArray
} from "~utils/assertions";
import { getMissingPermissions } from "~applications/permissions";
import { createContextMenus } from "~utils/context_menus";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { updateIcon } from "~utils/icon";
import Application from "~applications/application";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";

const background: BackgroundModuleFunction<void> = async (
  appData,
  permissions: unknown,
  appInfo: unknown = {},
  gateway?: unknown
) => {
  // validate input
  isNotEmptyArray(permissions);
  isPermissionsArray(permissions);
  isAppInfo(appInfo);

  if (gateway) isGateway(gateway);

  // Note we are not checking if there are any wallets added anymore, as `requestUserAuthorization` (actually
  // `createAuthPopup`) do that automatically now and will open the Welcome page and throw a "No wallets" added error if
  // there are no wallets.

  // get permissions
  const app = new Application(appData.url);
  const existingPermissions = await app.getPermissions();

  // compare existing permissions
  if (existingPermissions) {
    // the permissions the dApp does not have yet
    const requiredPermissions = getMissingPermissions(
      existingPermissions,
      permissions
    );

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
        gateway
      },
      appData
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
