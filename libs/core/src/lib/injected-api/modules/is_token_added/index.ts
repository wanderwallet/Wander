import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = [];

const isTokenAddedModule: ModuleProperties = {
  functionName: "isTokenAdded",
  permissions,
};

export default isTokenAddedModule;
