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
