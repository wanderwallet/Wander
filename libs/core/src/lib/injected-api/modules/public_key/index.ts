import type { PermissionType } from "../../../applications/permissions";
import type { ModuleProperties } from "../../module";

const permissions: PermissionType[] = ["ACCESS_PUBLIC_KEY"];

const publicKey: ModuleProperties = {
  functionName: "getActivePublicKey",
  permissions,
};

export default publicKey;
