import { v4 as uuidv4 } from "uuid";

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
