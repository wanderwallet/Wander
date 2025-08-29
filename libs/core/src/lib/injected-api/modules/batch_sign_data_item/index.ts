import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["SIGN_TRANSACTION"];

const batchSignDataItem: ModuleProperties = {
  functionName: "batchSignDataItem",
  permissions,
};

export default batchSignDataItem;
