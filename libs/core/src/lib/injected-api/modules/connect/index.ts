import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = [];

const connect: ModuleProperties = {
  functionName: "connect",
  permissions,
};

export default connect;
