import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["SIGNATURE"];

const verifyMessage: ModuleProperties = {
  functionName: "verifyMessage",
  permissions,
};

export default verifyMessage;
