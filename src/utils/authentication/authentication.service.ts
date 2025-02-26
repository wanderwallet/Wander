import { AuthProviderType, Chain } from "embed-api";
import { trpcVanilla } from "~utils/embedded/embedded.utils";

async function authenticate(authProviderType: AuthProviderType) {
  return trpcVanilla.authenticate.mutate({ authProviderType });
}

/*
async function refreshSession() {
  return trpcVanilla.refreshSession.mutate();
}

async function logout() {
  return trpcVanilla.logout.mutate();
}
*/

async function generateFetchRecoverableAccountsChallenge(address: string) {
  return trpcVanilla.generateFetchRecoverableAccountsChallenge.mutate({
    chain: Chain.ARWEAVE,
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
    chain: Chain.ARWEAVE,
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
  // refreshSession,
  // logout,

  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  generateAccountRecoveryChallenge,
  recoverAccount
} as const;
