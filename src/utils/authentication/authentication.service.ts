import type { AuthProviderType } from "embed-api";
import { supabase, trpcVanilla } from "~utils/embedded/embedded.utils";
import type { Provider } from "@supabase/supabase-js";

const SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE: Record<
  AuthProviderType,
  Provider | null
> = {
  PASSKEYS: null,
  EMAIL_N_PASSWORD: null,
  GOOGLE: "google",
  FACEBOOK: "facebook",
  X: "twitter",
  APPLE: "apple"
};

async function authenticate(authProviderType: AuthProviderType) {
  // TODO: The authentication procedures are not needed.
  // return trpcVanilla.authenticate.mutate({ authProviderType });

  if (
    authProviderType === "PASSKEYS" ||
    authProviderType === "EMAIL_N_PASSWORD"
  ) {
    throw new Error(`${authProviderType} not supported yet.`);
  }

  const provider = SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE[authProviderType];

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // redirectTo: `${window.location.origin}#/auth/callback/google`,
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;

  return { url: data.url };
}

async function generateFetchRecoverableAccountsChallenge(address: string) {
  return trpcVanilla.generateFetchRecoverableAccountsChallenge.mutate({
    chain: "ARWEAVE",
    address
  });
}

async function fetchRecoverableAccounts(
  challengeId: string,
  challengeSolution: string
) {
  return trpcVanilla.fetchRecoverableAccounts.mutate({
    challengeId,
    challengeSolution
  });
}

async function generateAccountRecoveryChallenge(
  address: string,
  userId: string
) {
  return trpcVanilla.generateAccountRecoveryChallenge.mutate({
    chain: "ARWEAVE",
    address,
    userId
  });
}

async function recoverAccount(userId: string, challengeSolution: string) {
  return trpcVanilla.recoverAccount.mutate({
    userId,
    challengeSolution
  });
}

export const AuthenticationService = {
  authenticate,
  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  generateAccountRecoveryChallenge,
  recoverAccount
} as const;
