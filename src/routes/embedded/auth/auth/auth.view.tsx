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

export function AuthEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate, authStatus, setAuthEmail } = useEmbedded();
  const [isLoading, setIsLoading] = useState(false);

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
