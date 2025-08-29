/**
 * Pauses execution for a given number of milliseconds.
 *
 * @param {number} ms - Duration to sleep in milliseconds.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
