import type { PermissionType } from "~applications/permissions";
import type { SplitTransaction } from "./transaction_builder";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["SIGN_TRANSACTION"];

const sign: ModuleProperties = {
  functionName: "sign",
  permissions,
};

export default sign;

export interface BackgroundResult {
  transaction: SplitTransaction;
  arConfetti: string | false;
}
