import { sleep } from "~utils/promises/sleep";

/**
 * Retries a given function up to a maximum number of attempts.
 * @param fn - The asynchronous function to retry, which should return a Promise.
 * @param maxAttempts - The maximum number of attempts to make.
 * @param delay - The delay between attempts in milliseconds.
 * @return A Promise that resolves with the result of the function or rejects after all attempts fail.
 */
export async function retryWithDelay<T>(
  fn: (attempt: number) => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
): Promise<T> {
  let attempts = 0;

  const attempt = async (): Promise<T> => {
    try {
      return await fn(attempts);
    } catch (error) {
      attempts += 1;
      if (attempts < maxAttempts) {
        // console.log(`Attempt ${attempts} failed, retrying...`)
        return new Promise<T>((resolve) => setTimeout(() => resolve(attempt()), delay));
      } else {
        throw error;
      }
    }
  };

  return attempt();
}

/**
 * Retries a given asynchronous function up to a maximum number of attempts with a timeout for each attempt.
 * @param fn - The asynchronous function to retry, which should return a Promise.
 * @param maxAttempts - The maximum number of attempts to make.
 * @param delay - The delay between attempts in milliseconds.
 * @param timeout - The maximum time to wait for each attempt in milliseconds.
 * @return A Promise that resolves with the result of the function or rejects after all attempts fail.
 */
export async function retryWithDelayAndTimeout<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  timeout: number = 10000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      // Create a race between the function and the timeout
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
      ]);
      return result;
    } catch (error) {
      if (attempt < maxAttempts) {
        // console.log(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  // Final fallback error
  throw new Error("Max attempts reached without success.");
}

/**
 * Generic retry function for any async operation.
 * @param fn - The async function to be retried.
 * @param maxRetries - Maximum retry attempts.
 * @param retryDelay - Delay between retries in milliseconds.
 * @returns A promise of the type that the async function returns.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, retryDelay: number = 100): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * retryDelay;
        // console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
      }
    }
  }

  throw lastError;
}
