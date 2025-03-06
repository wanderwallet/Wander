import { createSupabaseClient, createTRPCClient } from "embed-api";
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
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";
const PARAM_APPLICATION_ID = "application-id";

const EMBEDDED_CLIENT_ID =
  searchParams.get(PARAM_CLIENT_ID) ||
  (process.env.NODE_ENV === "development"
    ? import.meta.env.VITE_EMBEDDED_CLIENT_ID
    : "");
const EMBEDDED_APPLICATION_ID =
  searchParams.get(PARAM_APPLICATION_ID) ||
  (process.env.NODE_ENV === "development"
    ? import.meta.env.VITE_EMBEDDED_APPLICATION_ID
    : "");
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
  getClientIdHeader,
  setClientIdHeader
} = createTRPCClient({
  baseURL: "http://localhost:3000",
  authToken: null,
  deviceNonce: undefined,
  clientId: EMBEDDED_CLIENT_ID,
  applicationId: EMBEDDED_APPLICATION_ID
});

function isInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    return true;
  }
}

// TODO: When developers set up a new app/domain, we should probably use a mechanism like Google Search Console where
// they need to create a file at the root of their domain, or add an HTML tag, so that we can verify it's actually theirs.

async function validateClientApplication() {
  try {
    const result = await trpcVanilla.validateApplication.query({
      clientId: EMBEDDED_CLIENT_ID,
      applicationId: EMBEDDED_APPLICATION_ID,
      applicationOrigin: EMBEDDED_ANCESTOR_ORIGIN
    });

    return result;
  } catch (err) {
    // Check if error message already exists
    const existingError = document.querySelector("[data-wander-error]");
    // Error already shown
    if (existingError) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.setAttribute("data-wander-error", "overlay");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      z-index: 99998;
    `;

    const errorPopover = document.createElement("div");
    errorPopover.setAttribute("data-wander-error", "popover");
    errorPopover.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      color: white;
      font-family: system-ui;
      text-align: center;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 99999;
      max-width: 400px;
      width: calc(100% - 32px);
    `;

    errorPopover.innerHTML = `
      <h1 style="
        color: #ff5757;
        margin: 0 0 8px 0;
        font-size: 16px;
        line-height: 1.4;
      ">Invalid Wander Embedded configuration</h1>
      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        opacity: 0.9;
      ">Please provide valid applicationId and clientId</p>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(errorPopover);
    throw new Error("Application validation failed");
  }
}

// Validate immediately on load
validateClientApplication();

// Exporting the router from one repo to another might, in some scenarios, return incorrect types, but it can be fixed
// by also importing the right AppRouter type and overriding the `client` type:
// type TRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;
// const trpcVanilla = client as TRPCClient;

const supabase = IS_EMBEDDED_APP
  ? createSupabaseClient(
      import.meta.env?.VITE_SUPABASE_URL || "",
      import.meta.env?.VITE_SUPABASE_ANON_KEY || ""
    )
  : null;

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
