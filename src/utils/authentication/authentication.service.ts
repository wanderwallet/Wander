import { AuthProviderType } from "embed-api";
import { supabase, trpcVanilla } from "~utils/embedded/embedded.utils";

async function authenticate(authProviderType: AuthProviderType) {
  // TODO: The authentication procedures are not needed.
  // return trpcVanilla.authenticate.mutate({ authProviderType });

  if ("GOOGLE" === authProviderType) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // redirectTo: `${window.location.origin}#/auth/callback/google`,
      }
    });

    if (error) throw error;

    return { url: data.url };
  }

  throw new Error(`${authProviderType} not supported yet.`);
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
