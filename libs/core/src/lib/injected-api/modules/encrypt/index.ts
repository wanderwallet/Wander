import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ENCRYPT"];

const encrypt: ModuleProperties = {
  functionName: "encrypt",
  permissions,
};

export default encrypt;
