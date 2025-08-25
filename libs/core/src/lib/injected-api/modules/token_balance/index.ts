import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_TOKENS"];

const tokenBalanceModule: ModuleProperties = {
  functionName: "tokenBalance",
  permissions,
};

export default tokenBalanceModule;
