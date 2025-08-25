/**
 * Checks if a string is a valid URL.
 *
 * @param url - The string to be checked.
 * @returns True if the string is a valid URL, false otherwise.
 */
export function isURL(url?: string): boolean {
  try {
    if (!url || typeof url !== "string") {
      return false;
    }
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
