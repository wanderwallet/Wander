import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ALL_ADDRESSES"];

const walletNames: ModuleProperties = {
  functionName: "getWalletNames",
  permissions,
};

export default walletNames;
