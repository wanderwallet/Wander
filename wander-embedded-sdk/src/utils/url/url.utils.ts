// When the Wander Embedded <iframe> is created, its URL will include the following search params:
// - client-id
// - origin
//
// The code/functions below run in the context of the SKD, that is, in the domain of the dApp that integrates Wander
// Embedded.

// Duplicated in `src/utils/embedded/embedded.utils.ts`:
const PARAM_CLIENT_ID = "client-id";
const PARAM_SERVER_BASE_URL = "server-base-url";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";

export interface GetEmbeddedURLOptions {
  clientId: string;
  baseURL: string;
  baseServerURL?: string;
}

export function getEmbeddedURL({
  clientId,
  baseURL,
  baseServerURL = ""
}: GetEmbeddedURLOptions) {
  const url = new URL(baseURL);
  const { searchParams } = url;

  searchParams.set(PARAM_CLIENT_ID, clientId);
  searchParams.set(PARAM_SERVER_BASE_URL, baseServerURL);
  searchParams.set(PARAM_ANCESTOR_ORIGIN, window.location.origin);

  return url.toString();
}
