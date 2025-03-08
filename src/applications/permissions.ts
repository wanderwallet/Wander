import { ExtensionStorage } from "~utils/storage";
import Application from "./application";

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
  ACCESS_TOKENS: "permissionAccessTokens"
};

/**
 * Get permissions that are missing from the
 * allowed permissions list
 *
 * @param existing The permissions the app already has
 * @param required The permissions the app is required to have
 * @returns The missing permissions
 */
export function getMissingPermissions(
  existing: PermissionType[],
  required: PermissionType[]
) {
  const missing = required.filter(
    (permission) => !existing.includes(permission)
  );

  return missing;
}

const IS_PERMISSIONS_RESET = "is_permissions_reset";

// Add a memory flag to prevent multiple executions even within the same session
let isResetInProgress = false;

/**
 * Reset all permissions for all apps
 */
export const resetAllPermissions = async (): Promise<void> => {
  try {
    const isPermissionsReset = await ExtensionStorage.get(IS_PERMISSIONS_RESET);
    // Check both storage and memory flags
    if (isPermissionsReset || isResetInProgress) {
      return;
    }

    // Set the in-progress flag
    isResetInProgress = true;

    // Get and validate connected apps
    const connectedApps = (await ExtensionStorage.get("apps")) || [];
    if (!Array.isArray(connectedApps) || connectedApps.length === 0) {
      await ExtensionStorage.set(IS_PERMISSIONS_RESET, true);
      return;
    }

    // Process apps in batches to prevent overwhelming the system
    const BATCH_SIZE = 5;
    const validApps = connectedApps.filter(
      (appUrl): appUrl is string =>
        Boolean(appUrl) && typeof appUrl === "string"
    );

    for (let i = 0; i < validApps.length; i += BATCH_SIZE) {
      const batch = validApps.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (appUrl) => {
          try {
            const app = new Application(appUrl);
            await app.updateSettings((val) => ({
              ...val,
              permissions: []
            }));
          } catch (error) {
            console.error(`Failed to reset permissions for ${appUrl}:`, error);
            throw error;
          }
        })
      );

      // Log failures for this batch
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Failed to process app ${i + index}:`, result.reason);
        }
      });
    }

    // Mark as complete
    await ExtensionStorage.set(IS_PERMISSIONS_RESET, true);
  } catch (error) {
    console.error("Error in resetAllPermissions:", error);
  } finally {
    // Always reset the in-progress flag
    isResetInProgress = false;
  }
};

export const signPolicyOptions = [
  "always_ask",
  "ask_when_spending",
  "auto_confirm"
] as const;
