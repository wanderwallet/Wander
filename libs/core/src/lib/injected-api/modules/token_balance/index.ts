import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ACCESS_TOKENS"];

const tokenBalanceModule: ModuleProperties = {
  functionName: "tokenBalance",
  permissions,
};

export default tokenBalanceModule;
