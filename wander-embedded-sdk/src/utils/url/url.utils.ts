// When the Wander Embedded <iframe> is created, its URL will include the following search params:
// - client-id
// - origin
//
// The code/functions below run in the context of the SKD, that is, in the domain of the dApp that integrates Wander
// Embedded.

// Duplicated in `src/utils/embedded/embedded.utils.ts`:
const PARAM_CLIENT_ID = "client-id";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";

// Duplicated in `src/utils/embedded/utils/wallets/embedded-wallets.utils.ts`:
export function getEmbeddedOrigin() {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:5173/"
    : "https://embedded-iframe.arconnect.io/";
}

export function getEmbeddedURL(clientId: string) {
  const base = getEmbeddedOrigin();
  const searchParams = new URLSearchParams();

  searchParams.set(PARAM_CLIENT_ID, clientId);
  searchParams.set(PARAM_ANCESTOR_ORIGIN, window.location.origin);

  return `${base}?${searchParams.toString()}`;
}
