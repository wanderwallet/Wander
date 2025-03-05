import { createSupabaseClient, createTRPCClient } from "embed-api";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

if (!IS_EMBEDDED_APP || typeof document === "undefined") {
  throw new Error("This file should only be loaded in Wander Embedded.");
}

// Then, its tRPC client will be initialized with the following headers:
// - authorization (getAuthTokenHeader / setAuthTokenHeader)
// - x-device-nonce (getDeviceNonceHeader / setDeviceNonceHeader)
// - x-api-key (getApiKeyHeader / setApiKeyHeader)
//
// The code/functions below run in the context of Wander Embedded iframe/domain.

const { search, ancestorOrigins } = document.location;
const searchParams = new URLSearchParams(search);
const ancestorOrigin = ancestorOrigins[ancestorOrigins.length - 1];

// Duplicated in `wander-embedded-sdk/src/utils/url/url.utils.ts`:
const PARAM_API_KEY = "api-key";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";

const EMBEDDED_API_KEY =
  searchParams.get(PARAM_API_KEY) ||
  (process.env.NODE_ENV === "development" ? "DEVELOPMENT_API_KEY" : "");
const EMBEDDED_ANCESTOR_ORIGIN =
  ancestorOrigin || searchParams.get(PARAM_ANCESTOR_ORIGIN);

// Note: DO NOT use document.referrer here as that will return the "incorrect" value when the user is redirected from
// an auth provider domain to back to Wander Embedded.

export function getEmbeddedAncestorOrigin() {
  return EMBEDDED_ANCESTOR_ORIGIN;
}

const {
  client: trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader,
  getApiKeyHeader,
  setApiKeyHeader
} = createTRPCClient({
  baseURL: "http://localhost:3000",
  authToken: null,
  deviceNonce: undefined,
  apiKey: EMBEDDED_API_KEY
});

// TODO: When developers set up a new app/domain, we should probably use a mechanism like Google Search Console where
// they need to create a file at the root of their domain, or add an HTML tag, so that we can verify it's actually theirs.

async function insecurelyValidateApiKey() {
  // return trpcVanilla.validateApiKey.query({
  //   apiKey: EMBEDDED_API_KEY,
  //   ancestorOrigin: EMBEDDED_ANCESTOR_ORIGIN,
  // }).catch((err) => {
  //   console.error(`Invalid API key or origin:`, err);
  //   document.write("Invalid API key or origin.");
  // });
}

insecurelyValidateApiKey();

// Exporting the router from one repo to another might, in some scenarios, return incorrect types, but it can be fixed
// by also importing the right AppRouter type and overriding the `client` type:
// type TRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;
// const trpcVanilla = client as TRPCClient;

const supabase = createSupabaseClient(
  import.meta.env?.VITE_SUPABASE_URL || "",
  import.meta.env?.VITE_SUPABASE_ANON_KEY || ""
);

export {
  supabase,
  trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader,
  getApiKeyHeader,
  setApiKeyHeader
};

if (process.env.NODE_ENV === "development") {
  (window as any).logout = () => {
    return supabase.auth.signOut();
  };
}
