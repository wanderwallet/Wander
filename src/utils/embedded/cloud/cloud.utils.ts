import { v4 as uuidv4 } from "uuid";
import type { PendingOperation } from "./cloud.types";
import { isInsideIframe } from "../iframe.utils";

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
export const AUTH_REDIRECT_LOCATION_KEY = "cloud_auth_redirect_location";

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

export const storeRedirectLocation = (location: string): void => {
  try {
    localStorage.setItem(AUTH_REDIRECT_LOCATION_KEY, location);
  } catch (error) {
    console.error("Error storing redirect location:", error);
  }
};

export const getRedirectLocation = (): string | null => {
  try {
    return localStorage.getItem(AUTH_REDIRECT_LOCATION_KEY);
  } catch (error) {
    console.error("Error reading redirect location:", error);
    return null;
  }
};

export const clearRedirectLocation = (): void => {
  localStorage.removeItem(AUTH_REDIRECT_LOCATION_KEY);
};

/**
 * Stores redirect state when popup is blocked during cloud authentication.
 * This includes the redirect flag, provider selection, redirect location, and pending operation.
 */
export const storeRedirectState = (provider: string, pendingOperation?: PendingOperation): void => {
  try {
    localStorage.setItem(AUTH_REDIRECT_FLAG, "true");
    localStorage.setItem(CLOUD_PROVIDER_STORAGE_KEY, provider);
    storeRedirectLocation(window.location.hash);
    if (pendingOperation) storePendingOperation(pendingOperation);
  } catch (error) {
    console.error("Error saving redirect state:", error);
  }
};

/**
 * Clears all cloud authentication state from localStorage.
 * This includes pending operations, redirect flags, and provider selection.
 */
export const clearCloudAuthState = (): void => {
  if (isInsideIframe()) return;
  clearPendingOperation();
  localStorage.removeItem(AUTH_REDIRECT_FLAG);
  localStorage.removeItem(CLOUD_PROVIDER_STORAGE_KEY);
  clearRedirectLocation();
};
