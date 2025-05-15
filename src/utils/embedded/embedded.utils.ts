import { AuthProviderType, createSupabaseClient, createTRPCClient } from "embed-api";
import { jwtDecode } from "jwt-decode";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import { isInsideIframe, EMBEDDED_ANCESTOR_ORIGIN, EMBEDDED_CLIENT_ID, EMBEDDED_SERVER_BASE_URL } from "./iframe.utils";
import { ExtensionStorage } from "~utils/storage";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { isDeviceNonceValid, storeDeviceNonce } from "./device-nonce/device-nonce.utils";

// Then, its tRPC client will be initialized with the following headers:
// - authorization (getAuthTokenHeader / setAuthTokenHeader)
// - x-device-nonce (getDeviceNonceHeader / setDeviceNonceHeader)
// - x-client-id (getClientIdHeader / setClientIdHeader)
// - x-application-id (getApplicationIdHeader / setApplicationIdHeader)
//
// The code/functions below run in the context of Wander Embedded iframe/domain.

// Note: This is run when trpc detects UNAUTHORIZED error.
export async function signOut() {
  try {
    // We send "embedded_close", instead of just closing the modal on "embedded_auth" (log out), because log out can be
    // triggered by the user clicking the sign out button (which should close the modal) or also automatically by
    // Supabase Auth callback, which should not close it.

    postEmbeddedMessage({
      type: "embedded_close",
      data: null,
    });

    ExtensionStorage.removeAll();
  } catch (err) {
    console.error("Error clearing extension storage:", err);
  }

  try {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out:", err);

    window.location.href = "#/";
    window.location.reload();
  }
}

// Create a singleton instance of `TRPCClient`
let trpcInstance: ReturnType<typeof createTRPCClient> | null = null;

function getTRPCClientAndUtils() {
  if (!IS_EMBEDDED_APP) return null;

  if (!trpcInstance) {
    trpcInstance = createTRPCClient({
      baseURL: EMBEDDED_SERVER_BASE_URL,
      authToken: null,
      deviceNonce: undefined,
      clientId: EMBEDDED_CLIENT_ID,
      applicationId: "",
      onAuthError: signOut,
    });
  }

  return trpcInstance;
}

const trpcClientAndUtils = getTRPCClientAndUtils();

const {
  client: trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader,
  getClientIdHeader,
  setClientIdHeader,
  setApplicationIdHeader,
} = trpcClientAndUtils || {};

// Exporting the router from one repo to another might, in some scenarios, return incorrect types, but it can be fixed
// by also importing the right AppRouter type and overriding the `client` type:
// type TRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;
// const trpcVanilla = client as TRPCClient;

// Create a singleton instance of `SupabaseClient` & `LocalStorage`
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export async function getSupabaseClient() {
  if (!IS_EMBEDDED_APP) return null;

  if (!supabaseInstance) {
    const storage = await LocalStorage.getInstance();

    supabaseInstance = createSupabaseClient(
      import.meta.env?.VITE_SUPABASE_URL || "",
      import.meta.env?.VITE_SUPABASE_ANON_KEY || "",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: {
            getItem: (key: string) => storage.getItem(key),
            setItem: (key: string, value: string) => storage.setItem(key, value),
            removeItem: (key: string) => storage.removeItem(key),
          },
        },
      },
    );
  }

  return supabaseInstance;
}

// Initialize the supabase client
getSupabaseClient();

export {
  trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader,
  getClientIdHeader,
  setClientIdHeader,
};

// TODO: When developers set up a new app/domain, we should probably use a mechanism like Google Search Console where
// they need to create a file at the root of their domain, or add an HTML tag, so that we can verify it's actually theirs.

// TODO: Move to embedded.provider and make sure it's called once deviceNonce has been loaded, and that a loader/spinner
// is shown until this validation has happened.

async function getSessionId() {
  try {
    const supabase = await getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const jwtDecoded = jwtDecode(session?.access_token) as {
      session_id: string;
    };
    return jwtDecoded.session_id;
  } catch (err) {
    return undefined;
  }
}

async function insecurelyValidateApplication() {
  try {
    const sessionId = await getSessionId();
    const applicationId = await trpcVanilla.validateApplication.query({
      clientId: EMBEDDED_CLIENT_ID,
      applicationOrigin: EMBEDDED_ANCESTOR_ORIGIN,
      sessionId,
    });

    setApplicationIdHeader(applicationId);
  } catch (err: any) {
    // Only show errors if we're inside an iframe
    if (!isInsideIframe()) return;

    // Only show errors for validation failures
    // TRPC errors will have data.code property
    if (!err.data?.code || !["NOT_FOUND", "BAD_REQUEST", "FORBIDDEN"].includes(err.data.code)) {
      console.error("Unexpected error during validation:", err);
      return;
    }

    const errorMessages = {
      NOT_FOUND: "Invalid application configuration. Please verify your clientId.",
      BAD_REQUEST: `Invalid origin URL provided`,
      FORBIDDEN: err.message || "This domain is not authorized to use this application.",
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
    location.replace(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    throw new Error("Application validation failed");
  }
}

export async function getSupabaseAuthFromUrl(url: string, authProviderType: AuthProviderType = "GOOGLE") {
  if (url) {
    // Calculate center position for the popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    let popup = window.open(
      url,
      "Auth",
      [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        "popup=1",
        "location=1",
        "status=1",
        "resizable=no",
        "toolbar=no",
        "menubar=no",
      ].join(","),
    );

    if (!popup) {
      console.error("Popup blocked. Please allow popups for this site.");
      // Redirect to Google's OAuth page
      // Opening the URL on the current tab won't work when Embedded is loaded inside the iframe:

      if (authProviderType !== "EMAIL_N_PASSWORD") {
        if (location.ancestorOrigins.length === 0) {
          console.log(`Redirecting to ${url}...`);

          window.location.href = url;
        } else {
          console.log(`Opening ${url}...`);

          popup = window.open(url, "_blank");
        }
      }
    }

    if (popup) {
      try {
        // Set up message listener and popup close checker
        const result = await Promise.race([
          // Auth completion promise
          new Promise<boolean>((resolve, reject) => {
            const messageHandler = async (event: MessageEvent) => {
              // Since same origin, we can check it exactly
              if (event.origin !== window.location.origin) return;

              if (event.data?.type === "AUTH_COMPLETE") {
                console.log("Auth message received:", event.data);
                cleanup();
                if (event.data?.success) {
                  const supabase = await getSupabaseClient();
                  if (event.data?.data) {
                    const { data } = event.data;
                    if (data.deviceNonce && isDeviceNonceValid(data.deviceNonce)) {
                      await storeDeviceNonce(data.deviceNonce);
                    }

                    const { error } = await supabase.auth.refreshSession({
                      refresh_token: data.refresh_token,
                    });

                    if (error) {
                      reject(new Error("Authentication failed"));
                    }
                  } else {
                    const { error } = await supabase.auth.refreshSession();
                    if (error) {
                      reject(new Error("Authentication failed"));
                    }
                  }

                  resolve(true);
                } else {
                  reject(new Error("Authentication failed"));
                }
              }
            };

            // Check for popup closure
            const popupCheckInterval = setInterval(() => {
              if (popup.closed) {
                cleanup();
                reject(new Error("Authentication cancelled - popup closed"));
              }
            }, 1000);

            // Timeout after 5 minutes
            const timeoutId = setTimeout(
              () => {
                cleanup();
                reject(new Error("Authentication timeout"));
              },
              5 * 60 * 1000,
            );

            // Cleanup function
            const cleanup = () => {
              window.removeEventListener("message", messageHandler);
              clearInterval(popupCheckInterval);
              clearTimeout(timeoutId);
            };

            window.addEventListener("message", messageHandler);
          }),
        ]);

        return result;
      } catch (error) {
        console.error("Authentication process failed:", error);
      }
    }
  } else {
    console.error("No URL returned from authenticate");
  }
}

// Validate immediately on load
// insecurelyValidateApplication();

if (IS_EMBEDDED_APP && process.env.NODE_ENV === "development") {
  (window as any).signOut = signOut;
  (window as any).logOut = signOut;
}
