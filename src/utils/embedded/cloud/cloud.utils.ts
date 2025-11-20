import { v4 as uuidv4 } from "uuid";
import type { PendingOperation } from "./cloud.types";

/**
 * Generate a unique ID for a file using SHA-256 hash and base64url encoding.
 * @param file - The file to generate an ID for.
 * @returns A unique ID for the file.
 * @throws If the file is not a valid file or the hash generation fails.
 */
export async function fileToId(file: File | Blob): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer); // hash bytes
    // convert to base64url (compact, 43 chars)
    const id = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return id;
  } catch {
    return uuidv4();
  }
}

export const AUTH_REDIRECT_FLAG = "google_drive_auth_redirecting";
export const CLOUD_PROVIDER_STORAGE_KEY = "cloud_provider_selected";
export const PENDING_OPERATION_KEY = "cloud_pending_operation";

export const storePendingOperation = (operation: PendingOperation): void => {
  try {
    localStorage.setItem(PENDING_OPERATION_KEY, JSON.stringify(operation));
  } catch (error) {
    console.error("Error storing pending operation:", error);
  }
};

export const getPendingOperation = (): PendingOperation | null => {
  try {
    const stored = localStorage.getItem(PENDING_OPERATION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as PendingOperation;
  } catch (error) {
    console.error("Error reading pending operation:", error);
    return null;
  }
};

export const clearPendingOperation = (): void => {
  localStorage.removeItem(PENDING_OPERATION_KEY);
};
