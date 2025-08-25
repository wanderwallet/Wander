import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

// permissions required by this module
const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const exampleModule: ModuleProperties = {
  // name of the function (window.arweave.wallet.getExample)
  functionName: "getExample",
  permissions,
};

export default exampleModule;
