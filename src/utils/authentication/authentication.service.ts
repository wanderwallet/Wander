import { AuthProviderType, type SupabaseUser } from "embed-api";
import { supabase, trpcVanilla } from "~utils/embedded/embedded.utils";

async function authenticate(authProviderType: AuthProviderType) {
  console.log("authenticate() 2");

  // return trpcVanilla.authenticate.mutate({ authProviderType });

  if ("GOOGLE" === authProviderType) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // redirectTo: undefined, // `${window.location.origin}/auth/callback/google`,
        // redirectTo: `${window.location.origin}#/auth/callback/google`,
      }
    });

    if (error) throw error;

    console.log("URL =", data.url);

    return { url: data.url };
  }
}

async function refreshSession(): Promise<SupabaseUser | null> {
  console.log("refreshSession()");

  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;

    console.log("refreshSession() =", data);

    return data.user;
  } catch (err) {
    console.error("refreshSession() error =", err);

    return null;
  }
}

async function logout() {
  console.log("logout()");

  try {
    // setIsLoading(true);

    // await logoutMutation.mutateAsync();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  } catch (err) {
    console.error("logout() error =", err);

    // setIsLoading(false);
  }
}

(window as any).logout = logout;

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
  refreshSession,
  logout,

  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  generateAccountRecoveryChallenge,
  recoverAccount
} as const;
