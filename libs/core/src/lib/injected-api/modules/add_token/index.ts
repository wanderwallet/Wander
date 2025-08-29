import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = [];

const addTokenModule: ModuleProperties = {
  functionName: "addToken",
  permissions,
};

export default addTokenModule;
