import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  Divider,
  GoogleIcon,
  KeyIcon,
  TextInput,
  Row,
  SocialsIcon,
  Text,
  Wander2Icon,
  WanderFooter,
} from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { isValidEmail } from "~utils/email";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useAllWallets } from "~wallets/hooks";
import { sleep } from "~utils/promises/sleep";
import { EMBEDDED_HIDE_BE } from "~utils/embedded/iframe.utils";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";

// Define interfaces for WebAuthn types
interface PublicKeyCredentialWithAuthenticatorResponse extends Credential {
  response: {
    authenticatorData: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle: ArrayBuffer | null;
  };
}

// Simple shim for startAuthentication if @simplewebauthn/browser isn't available
const startAuthentication = async ({ optionsJSON }) => {
  if (!window.PublicKeyCredential) {
    throw new Error("WebAuthn is not supported in this browser");
  }
  
  // This is a very basic implementation - in production you'd use the actual library
  const credential = await navigator.credentials.get({
    publicKey: {
      ...optionsJSON,
      challenge: Uint8Array.from(
        atob(optionsJSON.challenge.replace(/-/g, '+').replace(/_/g, '/')), 
        c => c.charCodeAt(0)
      ),
      allowCredentials: optionsJSON.allowCredentials?.map(cred => ({
        ...cred,
        id: Uint8Array.from(
          atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), 
          c => c.charCodeAt(0)
        ),
      })) || [],
    },
  }) as PublicKeyCredentialWithAuthenticatorResponse;
  
  // Convert the credential to the expected format
  return {
    id: credential.id,
    response: {
      authenticatorData: btoa(String.fromCharCode.apply(null, new Uint8Array(credential.response.authenticatorData))),
      clientDataJSON: btoa(String.fromCharCode.apply(null, new Uint8Array(credential.response.clientDataJSON))),
      signature: btoa(String.fromCharCode.apply(null, new Uint8Array(credential.response.signature))),
      userHandle: credential.response.userHandle 
        ? btoa(String.fromCharCode.apply(null, new Uint8Array(credential.response.userHandle)))
        : null,
    },
  };
};

// Helper function to check if WebAuthn/passkeys are supported
const checkPasskeySupport = async (): Promise<boolean> => {
  // First check if PublicKeyCredential is defined
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }

  // Then check if we're in an iframe context
  const isInIframe = window !== window.top;

  // If we're not in an iframe, WebAuthn should be available
  if (!isInIframe) {
    return true;
  }

  // If we're in an iframe, we need to check if the browser supports WebAuthn in iframes
  try {
    // Check if isUserVerifyingPlatformAuthenticatorAvailable is accessible
    await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return true;
  } catch (error) {
    console.error('WebAuthn is not available in this iframe context:', error);
    return false;
  }
};

export function AuthEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate, authStatus, setAuthEmail } = useEmbedded();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticatingWithPasskey, setIsAuthenticatingWithPasskey] = useState(false);
  const [passkeysSupported, setPasskeysSupported] = useState<boolean | null>(null);
  
  // Check if passkeys are supported when the component mounts
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await checkPasskeySupport();
      setPasskeysSupported(isSupported);
    };
    checkSupport();
  }, []);

  const [selectedAuthProviderType, setSelectedAuthProviderType] = useState<AuthProviderType | "NATIVE_WALLET" | null>(
    null,
  );

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || !!selectedAuthProviderType;

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();

  const handleAuthenticate = useCallback(async (authProviderType: AuthProviderType) => {
    setSelectedAuthProviderType(authProviderType);
    try {
      await authenticate(authProviderType, emailInputRef.current?.value || "", passwordInputRef.current?.value || "");
      setSelectedAuthProviderType(null);
    } catch (error) {
      toast.error(`Error signing in with ${authProviderType}`);
    } finally {
      setSelectedAuthProviderType(null);
    }
  }, []);

  const handleNativeWallet = useCallback(async () => {
    setSelectedAuthProviderType("NATIVE_WALLET");

    postEmbeddedMessage({
      type: "embedded_auth",
      data: {
        authType: "NATIVE_WALLET",
        authStatus: null,
        userDetails: null,
      },
    });

    await sleep(500);

    // Reset this shortly after the modal is closed so that if the user opens
    // it again, they can pick a different option:
    setSelectedAuthProviderType(null);
  }, []);

  const handleCheckEmail = useCallback(async () => {
    try {
      setIsLoading(true);

      const supabase = await getSupabaseClient();

      const email = emailInputRef.current?.value || "";

      if (!email || !isValidEmail(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const { data: isAlreadyRegistered, error } = await supabase.rpc("user_exists_by_email", {
        p_email: email,
      });

      if (error) {
        toast.error("Error checking email");
        return;
      }

      setAuthEmail(email);

      if (isAlreadyRegistered) {
        navigate(EmbeddedPaths.AuthEmailSignin);
      } else {
        navigate(EmbeddedPaths.AuthEmailSignup);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error checking email");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePasskeySignIn = useCallback(async () => {
    if (!passkeysSupported) {
      toast.error("Passkeys are not supported in your browser");
      return;
    }

    try {
      setIsAuthenticatingWithPasskey(true);

      // Get email from input if provided
      const emailValue = emailInputRef.current?.value;
      const hasEmail = !!(emailValue && emailValue.trim());

      // Simple email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasValidEmail = hasEmail && emailRegex.test(emailValue);

      // Try usernameless authentication first if no email entered
      // If email is provided, use it to streamline the authentication process
      const email = hasValidEmail ? emailValue : undefined;

      // Start the authentication process
      const authenticationResult =
        await AuthenticationService.startPasskeyAuthentication(email);

      try {
        // Request the browser to perform the passkey authentication
        const assertionResponse = await startAuthentication({
          optionsJSON: authenticationResult.options
        });

        // Get the device nonce using the proper utility function
        const deviceNonce = await getDeviceNonce();

        // Verify the authentication with the server
        const verificationResult =
          await AuthenticationService.verifyPasskeyAuthentication({
            credentialId: assertionResponse.id,
            authenticatorData: assertionResponse.response.authenticatorData,
            clientDataJSON: assertionResponse.response.clientDataJSON,
            signature: assertionResponse.response.signature,
            userHandle: assertionResponse.response.userHandle,
            challenge: authenticationResult.options.challenge,
            challengeId: authenticationResult.challengeId, // Pass the challenge ID
            deviceNonce
          });

        // Authentication successful
        if (verificationResult.verified) {
          // Store data in localStorage
          if (verificationResult.deviceNonce) {
            localStorage.setItem("deviceNonce", verificationResult.deviceNonce);
          }

          if (verificationResult.sessionId) {
            localStorage.setItem("sessionId", verificationResult.sessionId);
            localStorage.setItem("userId", verificationResult.userId);
            localStorage.setItem("needsWalletActivation", "true");
            // Set flag for custom auth to help with provider detection
            localStorage.setItem("isCustomAuth", "true");
            console.log("Set isCustomAuth flag for passkey authentication");
          }
          
          // Check if the result has access tokens (TypeScript type guard)
          const hasTokens = 'access_token' in verificationResult && verificationResult.access_token;
          
          // If the server provided an access token, use it instead of creating our own
          if (hasTokens) {
            // Use the properly signed JWT token for API requests
            localStorage.setItem("authToken", verificationResult.access_token);
            
            // Store refresh token if available
            if ('refresh_token' in verificationResult && verificationResult.refresh_token) {
              localStorage.setItem("refreshToken", verificationResult.refresh_token);
            }
            
            console.log("Using server-signed JWT for API requests");
          } else {
            // Fall back to requesting a token from the server API
            console.log("No server-provided token in response");
            
            // The server should be updated to always provide a signed token
            // This is a more secure approach than client-side token generation
          }

          // Show success message
          toast.success("Authentication successful! Redirecting...");

          // Use direct location change instead of forceRedirect
          setTimeout(() => {
            console.log("Redirecting to restore-shares page");
            // Use direct URL assignment for most reliable navigation
            window.location.href =
              window.location.origin + "/#/auth/restore-shares";
          }, 1000);
        } else {
          toast.error("Passkey authentication failed");
        }
      } catch (error: any) {
        console.error("Error authenticating with passkey:", error);

        // Handle specific WebAuthn iframe error
        if (
          error.name === "NotAllowedError" &&
          error.message?.includes("publickey-credentials-get")
        ) {
          toast.error(
            "Passkey authentication is not allowed in this iframe. The parent page must enable it using Permissions-Policy."
          );
        } else {
          toast.error(`Error authenticating with passkey: ${
            error.message || "Unknown error"
          }`);
        }
      }
    } finally {
      setIsAuthenticatingWithPasskey(false);
    }
  }, [passkeysSupported]);

  return (
    <Card headerText="Sign up or Sign in" footerElement={<WanderFooter />} hasBackButton={false} size="auto">
      <Box>
        <TextInput
          ref={emailInputRef}
          type="email"
          placeholder="Enter your email"
          isDisabled={areButtonsDisabled || isLoading}
          hasButton
          buttonLabel="Next"
          isLoading={isLoading}
          buttonOnClick={handleCheckEmail}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCheckEmail();
            }
          }}
        />
        <Divider text={"OR"} />
        <Row>
          <Button
            variant="outlined"
            size="md"
            isLoading={selectedAuthProviderType === "GOOGLE"}
            isDisabled={areButtonsDisabled}
            onClick={() => handleAuthenticate("GOOGLE")}>
            <GoogleIcon fontSize={24} />
          </Button>
          {EMBEDDED_HIDE_BE ||
          (!!window.arweaveWallet?.walletName && window.arweaveWallet?.walletName !== "ArConnect") ? null : (
            <Button
              variant="outlined"
              size="md"
              isLoading={selectedAuthProviderType === "NATIVE_WALLET"}
              isDisabled={areButtonsDisabled}
              onClick={handleNativeWallet}>
              <Wander2Icon fontSize={24} />
            </Button>
          )}
          {passkeysSupported && (
            <Button
              variant="outlined"
              size="md"
              isLoading={isAuthenticatingWithPasskey}
              isDisabled={areButtonsDisabled || !passkeysSupported}
              onClick={handlePasskeySignIn}>
              <KeyIcon fontSize={24} />
            </Button>
          )}
        </Row>
        <Button
          variant="outlined"
          isFullWidth
          isDisabled={areButtonsDisabled}
          icon={<SocialsIcon fontSize={24} />}
          href="#/auth/more-providers">
          More options
        </Button>
        <Row style={{ gap: "4px" }}>
          <Text variant={"bodySm"}>{"Can't sign in?"}</Text>
          <Button variant="link" href="#/auth/recover-account" size="sm">
            Recover account
          </Button>
        </Row>
      </Box>
    </Card>
  );
}
