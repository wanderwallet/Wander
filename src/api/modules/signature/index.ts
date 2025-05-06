import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["SIGNATURE"];

const signature: ModuleProperties = {
  functionName: "signature",
  permissions,
};

export default signature;
