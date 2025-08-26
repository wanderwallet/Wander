import { getAppURL } from "../../../utils/format/format";
import { getAppLogo } from "../../../utils/logo/logo.utils";
import type { Gateway } from "../../../gateways/gateway";
import type { AppInfo } from "../../../applications/application.class";
import { ModuleFunction } from "../../module";
import { PermissionType } from "../../../applications/permissions";

const foreground: ModuleFunction<[PermissionType[], AppInfo, Gateway | undefined]> = async (
  permissions: PermissionType[],
  appInfo: AppInfo = {},
  gateway?: Gateway,
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

  if (import.meta.env?.VITE_IS_EMBEDDED_APP === "1" && !appInfo.logo) {
    appInfo.logo = await getAppLogo();
  }

  return [permissions, appInfo, gateway];
}

export default foreground;
