import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const activeAddress: ModuleProperties = {
  functionName: "getActiveAddress",
  permissions,
};

export default activeAddress;
