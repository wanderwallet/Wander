import { getSupabaseClient, trpcVanilla } from "~utils/embedded/embedded.utils";
import type { Session } from "@supabase/supabase-js";
import type {
  AuthSignInWithPasswordParams,
  AuthVerifyOtpParams,
  OAutProviderType,
} from "~utils/embedded/embedded.types";
import { isInsideIframe } from "~utils/embedded/iframe.utils";
import {
  POPUP_CHECK_INTERVAL_MS,
  POPUP_AUTHENTICATION_TIMEOUT_MS,
  OAUTH_SUCCESS_MSG_TYPE,
  OAUTH_ERROR_MSG_TYPE,
  isOAuthErrorMessage,
  isOAuthSuccessMessage,
  OAuthError,
} from "~utils/authentication/authentication.utils";
import type { OAuthResultMessage, SupabaseProvider } from "~utils/authentication/authentication.types";

const SUPABASE_PROVIDER_BY_OAUTH_PROVIDER_TYPE: Record<OAutProviderType, SupabaseProvider | null> = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  X: "twitter",
  APPLE: "apple",
};

async function authenticateWithOAuth(oAuthProviderType: OAutProviderType): Promise<Session> {
  const provider = SUPABASE_PROVIDER_BY_OAUTH_PROVIDER_TYPE[oAuthProviderType];

  const supabase = await getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // redirectTo: `${window.location.origin}#/auth/callback/google`,
      // redirectTo: `${window.location.origin}#theme=${ EMBEDDED_THEME }`,
      redirectTo: window.location.origin,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  const { url } = data;

  if (!url) {
    throw new Error(OAuthError.MISSING_URL);
  }

  // Calculate center position for the popup:

  const width = Math.min(400, document.documentElement.offsetWidth);
  const height = Math.min(600, window.screen.availHeight - 32);
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
    throw new Error(OAuthError.CANNOT_OPEN_POPUP);
  }

  return new Promise<Session>((resolve, reject) => {
    async function authCompleteMessageHandler(event: MessageEvent<OAuthResultMessage>) {
      // Since same origin, we can check it exactly
      if (
        event.origin !== window.location.origin ||
        (event.data?.type !== OAUTH_SUCCESS_MSG_TYPE && event.data?.type !== OAUTH_ERROR_MSG_TYPE)
      )
        return;

      cleanup();

      popup.close();

      if (isOAuthErrorMessage(event.data)) {
        reject(new Error(event.data.errorCode, { cause: event.data }));
        return;
      }

      if (!isOAuthSuccessMessage(event.data)) {
        reject(new Error(OAuthError.INVALID_OAUTH_MESSAGE));
        return;
      }

      const supabase = await getSupabaseClient();

      const { data, error } = await supabase.auth.setSession(event.data.session);

      if (error) {
        reject(error);
        return;
      }

      if (!data.session) {
        reject(new Error(OAuthError.CANNOT_CREATE_SESSION));
        return;
      }

      resolve(data.session);
    }

    // Check if the popup window has been closed every POPUP_CHECK_INTERVAL_MS:

    const popupCheckInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error(OAuthError.POPUP_CLOSED));
      }
    }, POPUP_CHECK_INTERVAL_MS);

    // Timeout if authentication is not completed in less than POPUP_AUTHENTICATION_TIMEOUT_MS:

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(OAuthError.POPUP_TIMEOUT));
    }, POPUP_AUTHENTICATION_TIMEOUT_MS);

    // Cleanup function:

    const cleanup = () => {
      window.removeEventListener("message", authCompleteMessageHandler);
      clearInterval(popupCheckInterval);
      clearTimeout(timeoutId);
    };

    window.addEventListener("message", authCompleteMessageHandler);
  });
}

async function signInWithPassword(authParams: AuthSignInWithPasswordParams) {
  const supabase = await getSupabaseClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email: authParams.email,
    password: authParams.password,
  });

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
