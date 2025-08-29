import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ACCESS_ALL_ADDRESSES"];

const allAddresses: ModuleProperties = {
  functionName: "getAllAddresses",
  permissions,
};

export default allAddresses;
