import {
  PARAM_API_KEY,
  PARAM_ANCESTOR_ORIGIN
} from "wallet-api/wallet-sdk.es.js";

// When the Wander Embedded <iframe> is created, its URL will include the following search params:
// - api-key
// - origin
//
// The code/functions below run in the context of the SKD, that is, in the domain of the dApp that integrates Wander
// Embedded.

// Duplicated in `src/utils/embedded/embedded.utils.ts`:
const PARAM_API_KEY = "api-key";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";

export function getEmbeddedOrigin() {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:5173/"
    : "https://embedded-iframe.arconnect.io/";
}

export function getEmbeddedURL(apiKey: string) {
  const base = getEmbeddedOrigin();
  const searchParams = new URLSearchParams();

  searchParams.set(PARAM_API_KEY, apiKey);
  searchParams.set(PARAM_ANCESTOR_ORIGIN, window.location.origin);

  return `${base}?${searchParams.toString()}`;
}
