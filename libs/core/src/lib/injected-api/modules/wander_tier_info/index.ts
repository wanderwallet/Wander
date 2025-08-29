import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const wanderTierInfoModule: ModuleProperties = {
  functionName: "getWanderTierInfo",
  permissions,
};

export default wanderTierInfoModule;
