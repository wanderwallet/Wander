import { createRoot } from "react-dom/client";
import { WanderConnectAppRoot } from "./iframe";
import {
  EMBEDDED_CLIENT_ID,
  EMBEDDED_THEME,
  EMBEDDED_ANCESTOR_ORIGIN,
  EMBEDDED_HIDE_BE,
  EMBEDDED_SERVER_BASE_URL,
} from "~utils/embedded/iframe.utils";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import {
  type SupabaseJwtPayload,
  type OAuthSuccessMessage,
  type OAuthErrorMessage,
} from "~utils/authentication/authentication.types";
import {
  BACKGROUND_COLORS_BY_PROVIDER,
  OAUTH_ERROR_MSG_TYPE,
  OAUTH_SUCCESS_MSG_TYPE,
  OAuthError,
  POPUP_CONFIRMATION_TIMEOUT_MS,
  POPUP_ON_AUTH_TIMEOUT_MS,
} from "~utils/authentication/authentication.utils";
import { jwtDecode } from "jwt-decode";

if (process.env.NODE_ENV === "development") {
  console.log("Wander Connect URL params =", {
    NODE_ENV: process.env.NODE_ENV,
    EMBEDDED_CLIENT_ID,
    EMBEDDED_THEME,
    EMBEDDED_ANCESTOR_ORIGIN,
    EMBEDDED_HIDE_BE,
    EMBEDDED_SERVER_BASE_URL,
  });
}

/*
The logic below only runs when the app has been opened in a popup window (due to `window.opener`). This only happens
after user authenticates in any OAuth provider's page and is redirected back to the app, inside the popup window still,
which then only needs to send an AUTH_COMPLETE_MSG_TYPE event back to the tab/iframe that opened it originally.
*/

if (window.location.hash.startsWith("#access_token=") && window.opener) {
  async function completeOAuthAuthentication() {
    try {
      // Adjust the page background so that it's the same color as the provider's OAuth page:

      const searchParams = new URLSearchParams(location.hash.slice(1));
      const { app_metadata } = jwtDecode<SupabaseJwtPayload>(searchParams.get("access_token"));

      const provider =
        app_metadata.provider !== "email"
          ? app_metadata.provider
          : app_metadata.providers.find((provider) => provider !== "email");

      const isDarkTheme =
        EMBEDDED_THEME === "dark" ||
        (EMBEDDED_THEME === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      const backgroundColor = BACKGROUND_COLORS_BY_PROVIDER[provider][isDarkTheme ? 1 : 0];

      document.documentElement.style.setProperty("--defaultBackgroundColor", backgroundColor);
      document.documentElement.style.setProperty("--defaultTextColor", isDarkTheme ? "white" : "black");
    } catch {}

    const supabase = await getSupabaseClient();

    // Send error if onAuthStateChange not called in POPUP_ON_AUTH_TIMEOUT_MS:

    const onAuthTimeoutID = setTimeout(() => {
      window.opener.postMessage(
        {
          type: OAUTH_ERROR_MSG_TYPE,
          errorCode: OAuthError.OAUTH_TIMEOUT,
        } satisfies OAuthErrorMessage,
        window.location.origin,
      );
    }, POPUP_ON_AUTH_TIMEOUT_MS);

    // Wait for onAuthStateChange event with the validated session:

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token) return;

      subscription.unsubscribe();

      clearTimeout(onAuthTimeoutID);

      window.opener.postMessage(
        {
          type: OAUTH_SUCCESS_MSG_TYPE,
          session,
        } satisfies OAuthSuccessMessage,
        window.location.origin,
      );

      // If the iframe doesn't close this popup window after receiving the
      // AUTH_COMPLETE_MSG_TYPE message, it will close itself after POPUP_CONFIRMATION_TIMEOUT_MS:

      setTimeout(() => window.close(), POPUP_CONFIRMATION_TIMEOUT_MS);
    });
  }

  completeOAuthAuthentication();
} else if (window.location.search.startsWith("?error=")) {
  let errorCode: string | undefined;
  let errorDescription: string | undefined;

  try {
    const searchParams = new URLSearchParams(location.search);

    errorCode ||= searchParams.get("error");
    errorDescription ||= searchParams.get("error_description");
  } catch {}

  window.opener.postMessage(
    {
      type: OAUTH_ERROR_MSG_TYPE,
      errorCode,
      errorDescription,
    } satisfies OAuthErrorMessage,
    window.location.origin,
  );

  // If the iframe doesn't close this popup window after receiving the
  // AUTH_COMPLETE_MSG_TYPE message, it will close itself after POPUP_CONFIRMATION_TIMEOUT_MS:

  setTimeout(() => window.close(), POPUP_CONFIRMATION_TIMEOUT_MS);
} else {
  createRoot(document.getElementById("root")).render(<WanderConnectAppRoot />);
}
