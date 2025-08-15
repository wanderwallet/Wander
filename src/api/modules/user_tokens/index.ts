import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_TOKENS"];

const userTokensModule: ModuleProperties = {
  functionName: "userTokens",
  permissions,
};

export default userTokensModule;
