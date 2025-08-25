import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = [];

const addTokenModule: ModuleProperties = {
  functionName: "addToken",
  permissions,
};

export default addTokenModule;
