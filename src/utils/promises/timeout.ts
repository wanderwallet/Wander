/**
 * Timeout for resolving balances from ao
 */
export async function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms} ms`));
    }, ms);

    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
