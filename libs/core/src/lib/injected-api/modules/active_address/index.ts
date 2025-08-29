import { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const activeAddress: ModuleProperties = {
  functionName: "getActiveAddress",
  permissions,
};

export default activeAddress;
