import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = [];

const disconnect: ModuleProperties = {
  functionName: "disconnect",
  permissions,
};

export default disconnect;
