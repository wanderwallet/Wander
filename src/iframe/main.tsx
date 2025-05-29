import { createRoot } from "react-dom/client";
import { WanderConnectAppRoot } from "./iframe";
import {
  EMBEDDED_CLIENT_ID,
  EMBEDDED_THEME,
  EMBEDDED_ANCESTOR_ORIGIN,
  EMBEDDED_HIDE_BE,
  EMBEDDED_SERVER_BASE_URL,
} from "~utils/embedded/iframe.utils";

import "../../assets/popup.css";
import { sleep } from "~utils/promises/sleep";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";

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

// TODO: Do we need env variable check here so that this doesn't run for BE?
// TODO: Move to app entry/mount point and do not even start the app?
// TODO: Make the app work standalone too?
// TODO: Could the wallet activation fail because we attempt it before/while the session is refreshed?
// TODO: Add another case below to handle auth errors using a different "app"?

/*
The logic below only runs when the app has been opened in a popup window (due to `window.opener`). This only happens
after user authenticates in any OAuth provider's page and is redirected back to the app, inside the popup window still,
which then only needs to send an "AUTH_COMPLETE" event back to the tab/iframe that opened it originally.
*/

if (window.location.hash.startsWith("#access_token") && window.opener) {
  // TODO: Decode token and adjust page background based on system theme and provider's original background color?
  // TODO: Add a spinner directly into the index.html file
  // TODO: Show an "authentication complete" message and a close button in case it doesn't close automatically?

  async function completeOAuthAuthentication() {
    const supabase = await getSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("onAuthStateChange");

      if (!session?.access_token) return;

      subscription.unsubscribe();

      console.log("Send AUTH_COMPLETE");

      window.opener.postMessage(
        {
          type: "AUTH_COMPLETE",
          success: true,
          data: session,
        },
        window.location.origin,
      );

      // TODO: Needed?
      // wait sleep(500);

      window.close();
    });

    /*

    // We have completeAuth() in the onAuthStateChange callback, but if it didn't work,
    // we'll use a timeout to call it after a delay.
    setTimeout(() => {
      completeAuth(searchParams);
    }, 5000);
    */
  }

  completeOAuthAuthentication();
} else {
  console.log("RENDER APP");

  createRoot(document.getElementById("root")).render(<WanderConnectAppRoot />);
}
