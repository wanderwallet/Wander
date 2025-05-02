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
  WanderFooter
} from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import { startAuthentication } from "@simplewebauthn/browser";
import { useToasts } from "@arconnect/components-rebrand";
import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";

// Base64 utility functions
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Add a monitor to debug redirect issues
const injectRedirectMonitor = () => {
  try {
    // Create a script to monitor the redirect process
    const monitorScript = document.createElement("script");
    monitorScript.textContent = `
      (function() {
        console.log("🔍 Redirect monitor active");
        
        // Store original methods
        const originalReplace = window.location.replace;
        const originalAssign = window.location.assign;
        const originalOpen = window.open;
        
        // Monitor location.replace
        window.location.replace = function(url) {
          console.log("🔄 location.replace called with:", url);
          return originalReplace.apply(this, arguments);
        };
        
        // Monitor location.assign
        window.location.assign = function(url) {
          console.log("📌 location.assign called with:", url);
          return originalAssign.apply(this, arguments);
        };
        
        // Monitor location.href changes
        let hrefDescriptor = Object.getOwnPropertyDescriptor(window.location, 'href');
        if (hrefDescriptor && hrefDescriptor.set) {
          let originalSet = hrefDescriptor.set;
          Object.defineProperty(window.location, 'href', {
            set: function(url) {
              console.log("🔗 location.href set to:", url);
              return originalSet.call(this, url);
            },
            get: hrefDescriptor.get,
            configurable: true
          });
        }
        
        // Monitor window.open
        window.open = function(url, target) {
          console.log("🪟 window.open called with:", url, target);
          return originalOpen.apply(this, arguments);
        };
        
        // Add unload listener
        window.addEventListener('beforeunload', function() {
          console.log("🛑 Page unloading, final URL:", window.location.href);
        });
      })();
    `;
    document.head.appendChild(monitorScript);
    console.log("Redirect monitor injected");
  } catch (error) {
    console.error("Failed to inject redirect monitor:", error);
  }
};

// Now update the redirect function to be even more reliable
const forceRedirect = (path: string) => {
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/#${path}`;

  console.log("🚀 Initiating force redirect to:", url);

  // Inject monitor first to help with debugging
  injectRedirectMonitor();

  // Try with form submission (often most reliable)
  try {
    console.log("📝 Trying form submission method");
    const form = document.createElement("form");
    form.method = "GET";
    form.action = url;
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
    return;
  } catch (e) {
    console.error("Form method failed:", e);
  }

  // Try with replace
  try {
    console.log("🔄 Trying replace method");
    window.location.replace(url);
  } catch (e) {
    console.error("Replace method failed:", e);
  }

  // Try with direct assignment
  try {
    console.log("🔗 Trying direct assignment");
    window.location.href = url;
  } catch (e) {
    console.error("Direct assignment failed:", e);
  }

  // Try with window.open
  try {
    console.log("🪟 Trying window.open");
    const newWindow = window.open(url, "_self");
    if (newWindow) newWindow.focus();
  } catch (e) {
    console.error("Window.open failed:", e);
  }
};

export function AuthEmbeddedView() {
  const { authenticate, authStatus } = useEmbedded();
  const { setToast } = useToasts();

  const [selectedAuthProviderType, setSelectedAuthProviderType] =
    useState<AuthProviderType | null>(null);
  const [isAuthenticatingWithPasskey, setIsAuthenticatingWithPasskey] =
    useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [passkeysSupported, setPasskeysSupported] = useState(true);
  const [authError, setAuthError] = useState("");

  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !!selectedAuthProviderType ||
    isAuthenticatingWithPasskey;

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();

  const handleAuthenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      setSelectedAuthProviderType(authProviderType);
      try {
        await authenticate(
          authProviderType,
          emailInputRef.current?.value || "",
          passwordInputRef.current?.value || ""
        );
        setSelectedAuthProviderType(null);
      } catch (error) {
        toast.error(`Error signing in with ${authProviderType}`);
      } finally {
        setSelectedAuthProviderType(null);
      }
    },
    [authenticate]
  );

  const handleEmailSignup = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();

      const { error, data } = await supabase.auth.signUp({
        email: emailInputRef.current?.value || "",
        password: passwordInputRef.current?.value || ""
      });

      console.log({ error, data });
    } catch (error) {
      toast.error("Error signing up");
    }
  }, []);

  const handleEmailSignIn = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();
      const { error, data } = await supabase.auth.signInWithPassword({
        email: emailInputRef.current?.value || "",
        password: passwordInputRef.current?.value || ""
      });

      console.log({ error, data });
    } catch (error) {
      toast.error("Error signing in");
    }
  }, []);

  const handlePasskeySignIn = useCallback(async () => {
    if (!passkeysSupported) {
      setToast({
        type: "error",
        content: "Passkeys are not supported in your browser",
        duration: 3000
      });
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

        // Get the stored device nonce if available
        const deviceNonce = localStorage.getItem("deviceNonce") || undefined;

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

          // Show success message
          setToast({
            type: "success",
            content: "Authentication successful! Redirecting...",
            duration: 2000
          });

          // Use direct location change instead of forceRedirect
          setTimeout(() => {
            console.log("Redirecting to restore-shares page");
            // Use direct URL assignment for most reliable navigation
            window.location.href =
              window.location.origin + "/#/auth/restore-shares";
          }, 1000);
        } else {
          setToast({
            type: "error",
            content: "Passkey authentication failed",
            duration: 3000
          });
        }
      } catch (error: any) {
        console.error("Error authenticating with passkey:", error);

        // Handle specific WebAuthn iframe error
        if (
          error.name === "NotAllowedError" &&
          error.message?.includes("publickey-credentials-get")
        ) {
          setToast({
            type: "error",
            content:
              "Passkey authentication is not allowed in this iframe. The parent page must enable it using Permissions-Policy.",
            duration: 5000
          });
        } else {
          setToast({
            type: "error",
            content: `Error authenticating with passkey: ${
              error.message || "Unknown error"
            }`,
            duration: 3000
          });
        }
      }
    } finally {
      setIsAuthenticatingWithPasskey(false);
    }
  }, [passkeysSupported, setToast]);

  return (
    <Card
      headerText="Sign Up or Sign In"
      footerElement={<WanderFooter />}
      hasBackButton={false}
      size="auto"
    >
      <Box>
        <TextInput
          ref={emailInputRef}
          placeholder="E-Mail"
          isDisabled={areButtonsDisabled}
        />
        <br />
        <TextInput
          ref={passwordInputRef}
          placeholder="Password"
          isDisabled={areButtonsDisabled}
          isSecure
        />
        <br />
        <Button
          isFullWidth
          onClick={() => handleEmailSignup()}
          icon={<KeyIcon fontSize={24} />}
          isDisabled={areButtonsDisabled}
        >
          Email Sign Up
        </Button>
        <Button
          isFullWidth
          onClick={() => handleEmailSignIn()}
          icon={<KeyIcon fontSize={24} />}
          isDisabled={areButtonsDisabled}
        >
          Email Sign In
        </Button>

        <Button
          variant="primary"
          isFullWidth
          onClick={handlePasskeySignIn}
          icon={<KeyIcon fontSize={24} />}
          isLoading={isAuthenticatingWithPasskey}
          isDisabled={areButtonsDisabled || !passkeysSupported}
        >
          Sign in with Passkey
          {isInIframe && " (Requires permission from parent frame)"}
        </Button>

        {isInIframe && (
          <Text
            variant="bodyXs"
            style={{ color: "#FF9800", textAlign: "center", marginTop: 4 }}
          >
            Note: Using passkeys in an iframe requires parent frame permission
          </Text>
        )}

        <Divider text={"OR"} />
        <Row>
          <Button
            variant="outlined"
            size="md"
            isLoading={selectedAuthProviderType === "GOOGLE"}
            isDisabled={areButtonsDisabled}
            onClick={() => handleAuthenticate("GOOGLE")}
          >
            <GoogleIcon fontSize={24} />
          </Button>
          <Button variant="outlined" size="md" isDisabled>
            <Wander2Icon fontSize={24} />
          </Button>
        </Row>
        <Button
          variant="outlined"
          isFullWidth
          isDisabled
          icon={<SocialsIcon fontSize={24} />}
          href="#/auth/more-providers"
        >
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
