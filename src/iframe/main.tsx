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
import type { AuthCompleteMessage } from "~utils/authentication/authentication.types";
import {
  AUTH_COMPLETE_MSG_TYPE,
  POPUP_CONFIRMATION_TIMEOUT_MS,
  POPUP_ON_AUTH_TIMEOUT_MS,
} from "~utils/authentication/authentication.utils";

import "../../assets/popup.css";

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

// TODO: Add a spinner directly into the index.html file
// TODO: Decode token and adjust page background based on system theme and provider's original background color?
// TODO: Show an "authentication complete" message and a close button in case it doesn't close automatically?

// TODO: Do we need env variable check here so that this doesn't run for BE?
// TODO: Make the app work standalone too?
// TODO: Could the wallet activation fail because we attempt it before/while the session is refreshed?
// TODO: Add another case below to handle auth errors using a different "app"?

/*
The logic below only runs when the app has been opened in a popup window (due to `window.opener`). This only happens
after user authenticates in any OAuth provider's page and is redirected back to the app, inside the popup window still,
which then only needs to send an AUTH_COMPLETE_MSG_TYPE event back to the tab/iframe that opened it originally.
*/

if (window.location.hash.startsWith("#access_token=") && window.opener) {
  async function completeOAuthAuthentication() {
    const supabase = await getSupabaseClient();

    // Send error if onAuthStateChange not called in POPUP_ON_AUTH_TIMEOUT_MS:

    const onAuthTimeoutID = setTimeout(() => {
      window.opener.postMessage(
        {
          type: AUTH_COMPLETE_MSG_TYPE,
          success: false,
        } satisfies AuthCompleteMessage,
        window.location.origin,
      );
    }, POPUP_ON_AUTH_TIMEOUT_MS);

    // Wait for onAuthStateChange event with the validated session:

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("onAuthStateChange");

      if (!session?.access_token) return;

      subscription.unsubscribe();

      clearTimeout(onAuthTimeoutID);

      console.log(`Send ${AUTH_COMPLETE_MSG_TYPE}`);

      window.opener.postMessage(
        {
          type: AUTH_COMPLETE_MSG_TYPE,
          success: true,
          session,
        } satisfies AuthCompleteMessage,
        window.location.origin,
      );

      // If the iframe doesn't close this popup window after receiving the
      // AUTH_COMPLETE_MSG_TYPE message, it will close itself after POPUP_CONFIRMATION_TIMEOUT_MS:

      setTimeout(() => window.close(), POPUP_CONFIRMATION_TIMEOUT_MS);
    });
  }

  completeOAuthAuthentication();
} else if (window.location.search.startsWith("?error=")) {
  // TODO: This can happen in a regular tab but also in a popup window.
  console.log(window.location);
} else {
  console.log("RENDER APP");

  createRoot(document.getElementById("root")).render(<WanderConnectAppRoot />);
}
