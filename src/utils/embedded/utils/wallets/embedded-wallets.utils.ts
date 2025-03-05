import type { TempWalletPromise } from "~utils/embedded/embedded.types";

const FIVE_MINS_IN_MS = 5 * 60 * 1000;

export function isTempWalletPromiseExpired(
  tempWalletPromise: TempWalletPromise
) {
  return Date.now() - tempWalletPromise.createdAt >= FIVE_MINS_IN_MS;
}

// Duplicated in `wander-embedded-sdk/src/utils/url/url.utils.ts`:
export function getEmbeddedOrigin() {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:5173/"
    : "https://embedded-iframe.arconnect.io/";
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecuted = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const diff = now - lastExecuted;

    const execute = () => {
      lastExecuted = now;
      func(...args);
    };

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (diff >= delay) {
      execute();
    } else {
      timeoutId = setTimeout(execute, delay - diff);
    }
  };
}
