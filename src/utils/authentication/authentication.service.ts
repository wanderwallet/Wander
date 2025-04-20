import type { AuthProviderType } from "embed-api";
import { getSupabaseClient, trpcVanilla } from "~utils/embedded/embedded.utils";
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

// Use a trpc client with type casting for passkey operations
const passkeyClient = {
  startRegistration: {
    mutate: async (data: any) => {
      try {
        // Direct call to the route without any namespace
        return (trpcVanilla as any).startRegistration.mutate(data);
      } catch (err) {
        console.error("Error in startRegistration:", err);
        throw err;
      }
    }
  },
  verifyRegistration: {
    mutate: async (data: any) => {
      try {
        // Direct call to the route without any namespace
        return (trpcVanilla as any).verifyRegistration.mutate(data);
      } catch (err) {
        console.error("Error in verifyRegistration:", err);
        throw err;
      }
    }
  },
  startAuthentication: {
    mutate: async (data: any) => {
      try {
        // Direct call to the route without any namespace
        return (trpcVanilla as any).startAuthentication.mutate(data);
      } catch (err) {
        console.error("Error in startAuthentication:", err);
        throw err;
      }
    }
  },
  verifyAuthentication: {
    mutate: async (data: any) => {
      try {
        // Direct call to the route without any namespace
        return (trpcVanilla as any).verifyAuthentication.mutate(data);
      } catch (err) {
        console.error("Error in verifyAuthentication:", err);
        throw err;
      }
    }
  },
  checkUserPasskeys: {
    query: async (data: any) => {
      try {
        // Direct call to the route without any namespace
        return (trpcVanilla as any).checkUserPasskeys.query(data);
      } catch (err) {
        console.error("Error in checkUserPasskeys:", err);
        throw err;
      }
    }
  }
};

async function authenticate(authProviderType: AuthProviderType) {
  // TODO: The authentication procedures are not needed.
  // return trpcVanilla.authenticate.mutate({ authProviderType });

  if (authProviderType === "EMAIL_N_PASSWORD") {
    throw new Error(`${authProviderType} not supported yet.`);
  }

  if (authProviderType === "PASSKEYS") {
    // For passkeys, we'll start the registration process
    return startPasskeyRegistration();
  }

  const provider = SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE[authProviderType];

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // redirectTo: `${window.location.origin}#/auth/callback/google`,
      redirectTo: window.location.origin,
      skipBrowserRedirect: true
    }
  });

  if (error) throw error;

  return { url: data.url };
}

async function startPasskeyRegistration() {
  // Get the user's email from the current session
  const supabase = await getSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    throw new Error("User must be logged in to register a passkey");
  }

  // Start the registration process using the server-side API
  const registrationResult = await passkeyClient.startRegistration.mutate({
    email: session.user.email
  });

  return registrationResult;
}

async function verifyPasskeyRegistration(
  userId: string,
  attestationResponse: any
) {
  return passkeyClient.verifyRegistration.mutate({
    userId,
    attestationResponse
  });
}

/**
 * Initiates passkey authentication process with the server
 * @param email Optional email of the user trying to authenticate. If not provided, uses discoverable credentials flow.
 * @returns Authentication options from the server
 */
async function startPasskeyAuthentication(email?: string) {
  // Start the authentication process using the server-side API
  const authenticationResult = await passkeyClient.startAuthentication.mutate({
    email
  });

  return authenticationResult;
}

/**
 * Verifies the passkey authentication response from the browser
 * @param params Authentication response parameters
 * @returns Verification result from the server
 * @returns {Object} result
 * @returns {boolean} result.verified - Whether authentication was successful
 * @returns {string} result.userId - ID of the authenticated user
 * @returns {string} result.sessionId - ID of the created session
 * @returns {string} result.deviceNonce - Device nonce for future authentication
 */
async function verifyPasskeyAuthentication(params: {
  credentialId: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
  userHandle?: string;
  challenge: string;
  challengeId?: string;
  deviceNonce?: string;
}) {
  return passkeyClient.verifyAuthentication.mutate(params);
}

async function checkUserPasskeys() {
  try {
    // Get the user's email from the current session
    const supabase = await getSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      return { hasPasskeys: false };
    }

    // Check if the user has any passkeys registered via API
    const result = await passkeyClient.checkUserPasskeys.query({
      email: session.user.email
    });

    return result;
  } catch (error) {
    console.error("Error checking for user passkeys:", error);
    return { hasPasskeys: false };
  }
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
  startPasskeyRegistration,
  verifyPasskeyRegistration,
  startPasskeyAuthentication,
  verifyPasskeyAuthentication,
  checkUserPasskeys,
  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  generateAccountRecoveryChallenge,
  recoverAccount
} as const;
