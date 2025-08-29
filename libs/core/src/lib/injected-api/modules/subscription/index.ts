import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const subscriptionModule: ModuleProperties = {
  functionName: "subscription",
  permissions,
};

export default subscriptionModule;
