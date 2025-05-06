import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["SIGNATURE"];

const signMessage: ModuleProperties = {
  functionName: "signMessage",
  permissions,
};

export default signMessage;
