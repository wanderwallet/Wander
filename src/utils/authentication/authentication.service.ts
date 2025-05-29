import { getSupabaseClient, trpcVanilla } from "~utils/embedded/embedded.utils";
import type { Provider } from "@supabase/supabase-js";
import type {
  AuthSignInWithPasswordParams,
  AuthVerifyOtpParams,
  OAutProviderType,
} from "~utils/embedded/embedded.types";
import { isInsideIframe } from "~utils/embedded/iframe.utils";

const SUPABASE_PROVIDER_BY_OAUTH_PROVIDER_TYPE: Record<OAutProviderType, Provider | null> = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  X: "twitter",
  APPLE: "apple",
};

async function authenticateWithOAuth(oAuthProviderType: OAutProviderType) {
  const provider = SUPABASE_PROVIDER_BY_OAUTH_PROVIDER_TYPE[oAuthProviderType];

  const supabase = await getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // redirectTo: `${window.location.origin}#/auth/callback/google`,
      redirectTo: window.location.origin,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  const { url } = data;

  if (!url) {
    throw new Error(`Missing OAuth URL.`);
  }

  // Calculate center position for the popup:

  // TODO: Same size as the iframe?

  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  // Open the provider's OAuth page (Google, Twitter, Facebook, Apple) in a popup window:

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
    if (isInsideIframe()) {
      // When running inside the iframe, try opening in a new tab:

      console.warn("Could not open OAuth popup window. Opening new tab...");
      popup = window.open(url, "_blank");
    } else {
      // When running standalone, try opening on the same tab (won't work inside the iframe):

      console.warn("Could not open OAuth popup window. Opening in current tab...");
      window.location.href = url;

      return;
    }
  }

  if (!popup) {
    // TODO: Throw an error so that we can remove the loader?

    console.warn("Could not open OAuth popup window either way.");

    return;
  }

  // TODO: Is the code below running `refreshSession` twice if unpartitioned state is supported?

  // Set up message listener and popup close checker

  // Auth completion promise

  await new Promise<void>((resolve, reject) => {
    const messageHandler = async (event: MessageEvent) => {
      // Since same origin, we can check it exactly
      // TODO: Move "AUTH_COMPLETE" to constant:
      if (event.origin !== window.location.origin || event.data?.type !== "AUTH_COMPLETE") return;

      console.log("AUTH_COMPLETE received", event.data);

      cleanup();

      if (event.data?.success) {
        const supabase = await getSupabaseClient();
        // Can we just send an AUTH_COMPLETE message without data?
        if (event.data?.data) {
          const { data } = event.data;
          await supabase.auth.refreshSession({
            refresh_token: data.refresh_token,
          });
        } else {
          await supabase.auth.refreshSession();
        }

        resolve();
      } else {
        reject(new Error("Authentication failed"));
      }
    };

    // TODO: Move delays below to constants:

    // Check for popup closure
    const popupCheckInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Authentication cancelled - popup closed"));
      }
    }, 250);

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
  });
}

async function signInWithPassword(authParams: AuthSignInWithPasswordParams) {
  const supabase = await getSupabaseClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email: authParams.email,
    password: authParams.password,
  });

  console.log("signInWithPassword() =", data, error);

  if (error) throw error;

  return data;
}
async function verifyOtp(authParams: AuthVerifyOtpParams) {
  const supabase = await getSupabaseClient();

  const { error, data } = await supabase.auth.verifyOtp({
    email: authParams.email,
    token: authParams.token,
    type: "email",
  });

  console.log("verifyOtp() =", data, error);

  if (error) throw error;

  return data;
}

async function generateFetchRecoverableAccountsChallenge(address: string) {
  return trpcVanilla.generateFetchRecoverableAccountsChallenge.mutate({
    chain: "ARWEAVE",
    address,
  });
}

async function fetchRecoverableAccounts(challengeId: string, challengeSolution: string) {
  return trpcVanilla.fetchRecoverableAccounts.mutate({
    challengeId,
    challengeSolution,
  });
}

async function fetchRecoverableAccountWallets(challengeId: string, challengeSolution: string, userId: string) {
  return trpcVanilla.fetchRecoverableAccountWallets.mutate({
    challengeId,
    challengeSolution,
    userId,
  });
}

async function generateAccountRecoveryChallenge(address: string, userId: string) {
  return trpcVanilla.generateAccountRecoveryChallenge.mutate({
    chain: "ARWEAVE",
    address,
    userId,
  });
}

async function recoverAccount(userId: string, challengeSolution: string) {
  return trpcVanilla.recoverAccount.mutate({
    userId,
    challengeSolution,
  });
}

export const AuthenticationService = {
  authenticateWithOAuth,
  signInWithPassword,
  verifyOtp,
  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  fetchRecoverableAccountWallets,
  generateAccountRecoveryChallenge,
  recoverAccount,
} as const;
