import type { AuthProviderType } from "embed-api";
import { getSupabaseClient, trpcVanilla } from "~utils/embedded/embedded.utils";
import type { Provider } from "@supabase/supabase-js";

// Define API_URL directly in the file
const API_URL = process.env.VITE_API_URL || "https://api.wander.app";

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
  },
  finalizePasskey: {
    mutate: async (data: any) => {
      try {
        // Direct call to the route without any namespace
        return (trpcVanilla as any).finalizePasskey.mutate(data);
      } catch (err) {
        console.error("Error in finalizePasskey:", err);
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

  if (!provider) {
    throw new Error(`Provider ${authProviderType} is not configured properly`);
  }

  try {
    const supabase = await getSupabaseClient();

    // Improve OAuth flow with detailed params
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
        scopes: provider === "google" ? "email profile" : undefined
      }
    });

    if (error) {
      console.error("OAuth error:", error);
      throw error;
    }

    if (!data?.url) {
      throw new Error("No OAuth URL returned from Supabase");
    }

    return { url: data.url };
  } catch (error) {
    console.error(`Error during ${provider} authentication:`, error);
    throw error;
  }
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
 * Finalizes a passkey registration by processing the verification response
 * @param params Verification parameters
 * @returns Verification result
 */
async function finalizePasskeyRegistration(params: {
  verificationId: string;
  email: string;
  sessionToken: string;
  deviceNonce?: string;
}) {
  const result = await passkeyClient.finalizePasskey.mutate(params);

  // Check if we received Supabase-compatible tokens
  if (result.access_token && result.refresh_token) {
    try {
      console.log("Received auth tokens, setting up Supabase session");

      // Get the Supabase client
      const supabase = await getSupabaseClient();

      // Set the session in Supabase with our custom tokens
      const { data, error } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token
      });

      if (error) {
        console.error("Error setting Supabase session:", error);
      } else {
        console.log("Successfully set up Supabase session with passkey tokens");
      }
    } catch (error) {
      console.error("Error during Supabase session setup:", error);
    }
  }

  return result;
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
 * Verifies the passkey authentication response from the browser and sets up the Supabase session
 * @param params Authentication response parameters
 * @returns Verification result from the server
 * @returns {Object} result
 * @returns {boolean} result.verified - Whether authentication was successful
 * @returns {string} result.userId - ID of the authenticated user
 * @returns {string} result.sessionId - ID of the created session
 * @returns {string} result.deviceNonce - Device nonce for future authentication
 * @returns {string} result.access_token - Supabase-compatible access token
 * @returns {string} result.refresh_token - Supabase-compatible refresh token
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
  // Get the authentication result from the API
  const authResult = await passkeyClient.verifyAuthentication.mutate(params);

  // Check if we received Supabase-compatible tokens
  if (authResult.access_token && authResult.refresh_token) {
    try {
      console.log("Received auth tokens, setting up Supabase session");

      // Get the Supabase client
      const supabase = await getSupabaseClient();

      // Set the session in Supabase with our custom tokens
      const { data, error } = await supabase.auth.setSession({
        access_token: authResult.access_token,
        refresh_token: authResult.refresh_token
      });

      if (error) {
        console.error("Error setting Supabase session:", error);
      } else {
        console.log("Successfully set up Supabase session with passkey tokens");
      }
    } catch (error) {
      console.error("Error during Supabase session setup:", error);
    }
  } else {
    console.warn("No authentication tokens received from server");
  }

  return authResult;
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

/**
 * Handles OAuth callback processing after redirect
 * @returns Result of the OAuth callback processing
 */
async function handleOAuthCallback() {
  try {
    const supabase = await getSupabaseClient();

    // Check if we already have a session from the hash parameters
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return { success: false, error: error.message };
    }

    if (data.session) {
      console.log("Session already exists, OAuth flow successful");
      return { success: true };
    }

    // If no session, try to extract tokens from URL hash
    const hashParams = window.location.hash.substring(1);
    const searchParams = window.location.search.substring(1);
    const params = new URLSearchParams(hashParams || searchParams);

    // Check for errors in the URL
    const errorDescription =
      params.get("error_description") || params.get("error");
    if (errorDescription) {
      console.error("OAuth error from URL:", errorDescription);
      return { success: false, error: errorDescription };
    }

    // Extract tokens if available
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      console.log("Found tokens in URL, setting session");

      const sessionResult = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionResult.error) {
        console.error("Failed to set session:", sessionResult.error);
        return { success: false, error: sessionResult.error.message };
      }

      return { success: true };
    }

    return { success: false, error: "No authentication data found" };
  } catch (error) {
    console.error("Error handling OAuth callback:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gets a valid server-signed token for an existing session ID
 * This replaces client-side token generation with proper server authentication
 *
 * @param sessionId The session ID to authenticate
 * @param deviceNonce The device nonce for additional verification
 * @returns A properly signed access token from the server
 */
export async function getSessionToken(
  sessionId: string,
  deviceNonce: string
): Promise<{ access_token: string }> {
  const url = `${API_URL}/auth/sessions/${sessionId}/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-nonce": deviceNonce
    },
    body: JSON.stringify({ sessionId, deviceNonce })
  });

  if (!response.ok) {
    throw new Error(`Failed to get session token: ${response.status}`);
  }

  return response.json();
}

export const AuthenticationService = {
  authenticate,
  startPasskeyRegistration,
  verifyPasskeyRegistration,
  finalizePasskeyRegistration,
  startPasskeyAuthentication,
  verifyPasskeyAuthentication,
  checkUserPasskeys,
  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  generateAccountRecoveryChallenge,
  recoverAccount,
  handleOAuthCallback,
  getSessionToken
} as const;
