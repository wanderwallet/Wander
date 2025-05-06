/**
 * Validates an email address
 *
 * Basic validation checks:
 * - Must have text before @
 * - Must have @ symbol
 * - Must have domain after @
 * - Must have a TLD (top-level domain)
 * - No spaces allowed
 * - Common special characters allowed in local part
 *
 * @param email The email address to validate
 * @returns boolean - true if valid, false if invalid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  // RFC 5322 compliant regex for email validation
  // This pattern checks:
  // - Local part (before @) allows alphanumeric characters, special chars !#$%&'*+-/=?^_`{|}~
  // - Domain part (after @) allows only alphanumeric and hyphens
  // - At least one dot in domain part
  // - TLD (last part) must be at least 2 characters
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return emailRegex.test(email);
}

/**
 * Validates an email with simpler rules
 *
 * Use this for quick validation where full RFC compliance isn't necessary
 *
 * @param email The email address to validate
 * @returns boolean - true if valid, false if invalid
 */
export function isValidEmailSimple(email: string): boolean {
  if (!email) return false;

  // Simple version that checks for:
  // - Text before @
  // - @ symbol
  // - Domain with at least one dot
  const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return simpleEmailRegex.test(email);
}
