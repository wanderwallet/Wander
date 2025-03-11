import { createSupabaseClient, createTRPCClient } from "embed-api";
import { jwtDecode } from "jwt-decode";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

// Then, its tRPC client will be initialized with the following headers:
// - authorization (getAuthTokenHeader / setAuthTokenHeader)
// - x-device-nonce (getDeviceNonceHeader / setDeviceNonceHeader)
// - x-client-id (getClientIdHeader / setClientIdHeader)
// - x-application-id (getApplicationIdHeader / setApplicationIdHeader)
//
// The code/functions below run in the context of Wander Embedded iframe/domain.

const { search = "", ancestorOrigins = [] } = IS_EMBEDDED_APP
  ? document.location
  : {};

const searchParams = new URLSearchParams(search);
const ancestorOrigin = ancestorOrigins[ancestorOrigins.length - 1];

// Duplicated in `wander-embedded-sdk/src/utils/url/url.utils.ts`:
const PARAM_CLIENT_ID = "client-id";
const PARAM_SERVER_BASE_URL = "server-base-url";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";

const EMBEDDED_CLIENT_ID =
  searchParams.get(PARAM_CLIENT_ID) ||
  (process.env.NODE_ENV === "development"
    ? import.meta.env?.VITE_EMBEDDED_CLIENT_ID
    : "");

const EMBEDDED_SERVER_BASE_URL =
  searchParams.get(PARAM_SERVER_BASE_URL) ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

const EMBEDDED_ANCESTOR_ORIGIN =
  ancestorOrigin || searchParams.get(PARAM_ANCESTOR_ORIGIN);

// Note: DO NOT use document.referrer here as that will return the "incorrect" value when the user is redirected from
// an auth provider domain to back to Wander Embedded.

export function getEmbeddedAncestorOrigin() {
  return EMBEDDED_ANCESTOR_ORIGIN;
}

export function isInsideIframe(): boolean {
  try {
    return window.self !== window.top || !!ancestorOrigin;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    return true;
  }
}

const {
  client: trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader,
  getClientIdHeader,
  setClientIdHeader,
  setApplicationIdHeader
} = createTRPCClient({
  baseURL: EMBEDDED_SERVER_BASE_URL,
  authToken: null,
  deviceNonce: undefined,
  clientId: EMBEDDED_CLIENT_ID,
  applicationId: ""
});

// TODO: When developers set up a new app/domain, we should probably use a mechanism like Google Search Console where
// they need to create a file at the root of their domain, or add an HTML tag, so that we can verify it's actually theirs.

// Exporting the router from one repo to another might, in some scenarios, return incorrect types, but it can be fixed
// by also importing the right AppRouter type and overriding the `client` type:
// type TRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;
// const trpcVanilla = client as TRPCClient;

const supabase = IS_EMBEDDED_APP
  ? createSupabaseClient(
      import.meta.env?.VITE_SUPABASE_URL || "",
      import.meta.env?.VITE_SUPABASE_ANON_KEY || ""
      /*
      {
        auth: {
          storage: {

          },
        }
      }
        */
    )
  : null;

async function getSessionId() {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const jwtDecoded = jwtDecode(session?.access_token) as {
      session_id: string;
    };
    return jwtDecoded.session_id;
  } catch (err) {
    return undefined;
  }
}

// TODO: Move to embedded.provider and make sure it's called once deviceNonce has been loaded, and that a loader/spinner
// is shown until this validation has happened.

async function insecurelyValidateApplication() {
  try {
    const sessionId = await getSessionId();
    const applicationId = await trpcVanilla.validateApplication.query({
      clientId: EMBEDDED_CLIENT_ID,
      applicationOrigin: EMBEDDED_ANCESTOR_ORIGIN,
      sessionId
    });

    setApplicationIdHeader(applicationId);
  } catch (err: any) {
    // Only show errors if we're inside an iframe
    if (!isInsideIframe()) return;

    // Only show errors for validation failures
    // TRPC errors will have data.code property
    if (
      !err.data?.code ||
      !["NOT_FOUND", "BAD_REQUEST", "FORBIDDEN"].includes(err.data.code)
    ) {
      console.error("Unexpected error during validation:", err);
      return;
    }

    const errorMessages = {
      NOT_FOUND:
        "Invalid application configuration. Please verify your clientId.",
      BAD_REQUEST: `Invalid origin URL provided`,
      FORBIDDEN:
        err.message || "This domain is not authorized to use this application."
    };

    const errorMessage = errorMessages[err.data.code];
    if (!errorMessage) {
      return;
    }

    // Replace the entire document content and prevent any further execution
    const html = `<!DOCTYPE html><html lang="en" style="height:100%;overflow:hidden"><head><style>html,body{margin:0;padding:0;height:100%;overflow:hidden}body{font-family:system-ui;background:#1a1a1a;color:white;display:flex;align-items:center;justify-content:center}.error-container{max-width:400px;text-align:center;padding:16px}.error-title{color:#ff5757;margin:0 0 8px 0;font-size:16px;line-height:1.4}.error-message{margin:0;font-size:14px;line-height:1.5;opacity:.9}</style></head><body><div class="error-container"><h1 class="error-title">Invalid Wander Embedded configuration</h1><p class="error-message">${errorMessage}</p></div><script>window.onbeforeunload=()=>false;</script></body></html>`;

    // Stop any ongoing resource loading
    window.stop();

    // Replace the entire document content
    location.replace(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    throw new Error("Application validation failed");
  }
}

// Validate immediately on load
// insecurelyValidateApplication();

export {
  supabase,
  trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader,
  getClientIdHeader,
  setClientIdHeader
};

if (IS_EMBEDDED_APP && process.env.NODE_ENV === "development") {
  (window as any).logout = () => {
    return supabase.auth.signOut();
  };
}
