import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ARWEAVE_CONFIG"];

const arweaveConfig: ModuleProperties = {
  functionName: "getArweaveConfig",
  permissions,
};

export default arweaveConfig;
