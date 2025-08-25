import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["DECRYPT"];

const decrypt: ModuleProperties = {
  functionName: "decrypt",
  permissions,
};

export default decrypt;
