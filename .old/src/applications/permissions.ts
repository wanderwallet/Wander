/**
 * Wander permissions
 */
export type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_PUBLIC_KEY"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION"
  | "ENCRYPT"
  | "DECRYPT"
  | "SIGNATURE"
  | "ACCESS_ARWEAVE_CONFIG"
  | "DISPATCH"
  | "ACCESS_TOKENS";

/**
 * All permissions with their descriptions
 */
export const permissionData: Record<PermissionType, string> = {
  ACCESS_ADDRESS: "permissionDescriptionAccessAddress",
  ACCESS_PUBLIC_KEY: "permissionDescriptionAccessPublicKey",
  ACCESS_ALL_ADDRESSES: "permissionDescriptionAccessAllAddresses",
  SIGN_TRANSACTION: "permissionDescriptionSign",
  ENCRYPT: "permissionDescriptionEncrypt",
  DECRYPT: "permissionDescriptionDecrypt",
  SIGNATURE: "permissionDescriptionSignature",
  ACCESS_ARWEAVE_CONFIG: "permissionDescriptionArweaveConfig",
  DISPATCH: "permissionDescriptionDispatch",
  ACCESS_TOKENS: "permissionAccessTokens",
};

/**
 * Get permissions that are missing from the
 * allowed permissions list
 *
 * @param existing The permissions the app already has
 * @param required The permissions the app is required to have
 * @returns The missing permissions
 */
export function getMissingPermissions(existing: PermissionType[], required: PermissionType[]) {
  const missing = required.filter((permission) => !existing.includes(permission));

  return missing;
}

export const signPolicyOptions = ["always_ask", "ask_when_spending", "auto_confirm"] as const;
