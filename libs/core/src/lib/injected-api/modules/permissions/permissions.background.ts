import { Application } from "../../../applications/application.class";
import type { PermissionType } from "../../../applications/permissions";
import type { BackgroundModuleFunction } from "../../background/background-modules";

const background: BackgroundModuleFunction<PermissionType[]> = async (appData) => {
  // construct app
  const app = new Application(appData.url);

  // grab permissions for this app
  const permissions = await app.getPermissions();

  return permissions;
};

export default background;
