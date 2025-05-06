import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["DISPATCH"];

const dispatch: ModuleProperties = {
  functionName: "dispatch",
  permissions,
};

export interface DispatchResult {
  id: string;
  type?: "BASE" | "BUNDLED";
}

/** Maximum size (in bytes) sponsored for bundles using the Bundlr Network */
export const ACCEPTED_DISPATCH_SIZE = 120 * Math.pow(10, 3);

export default dispatch;
