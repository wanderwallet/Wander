import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["SIGNATURE"];

const privateHash: ModuleProperties = {
  functionName: "privateHash",
  permissions,
};

export default privateHash;
