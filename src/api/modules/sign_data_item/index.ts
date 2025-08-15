import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["SIGN_TRANSACTION"];

const signDataItem: ModuleProperties = {
  functionName: "signDataItem",
  permissions,
};

export default signDataItem;
