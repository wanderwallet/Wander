export type ResolvablePromise<T> = Promise<T> & { resolve: (v: T) => void };

export function getResolvablePromise<T = void>() {
  let resolve = (v: T) => {};

  const promise = new Promise<T>((r) => {
    resolve = r;
  }) as ResolvablePromise<T>;

  promise.resolve = resolve;

  return promise;
}
