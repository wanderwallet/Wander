import type { PermissionType } from "~applications/permissions";
import type { AppInfo } from "~applications/application";
import type { ModuleFunction } from "~api/module";
import { type Gateway } from "~gateways/gateway";
import { getAppURL } from "~utils/format";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { getAppLogo } from "~utils/embedded/utils/logo/logo.utils";

const foreground: ModuleFunction<any[]> = async (
  permissions: PermissionType[],
  appInfo: AppInfo = {},
  gateway?: Gateway
) => {
  // check permissions
  if (!permissions || permissions.length === 0) {
    throw new Error("No permissions requested");
  }

  // construct app info if not provided
  if (!appInfo.name) {
    // grab site title
    const siteTitle = document.title;
    const tabURL = getAppURL(window.location.href);

    // use site title if it is < than 11 chars
    appInfo.name = siteTitle.length < 11 ? siteTitle : tabURL;
  }

  if (IS_EMBEDDED_APP && !appInfo.logo) {
    appInfo.logo = await getAppLogo();
  }

  return [permissions, appInfo, gateway];
};

export default foreground;
