import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const wanderTierModule: ModuleProperties = {
  functionName: "wanderTier",
  permissions,
};

export default wanderTierModule;
