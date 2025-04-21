import { Button, Text, useToasts } from "@arconnect/components-rebrand";
import styled from "styled-components";
import { useState, useEffect } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import { Shield01 } from "@untitled-ui/icons-react";

interface PasskeySignInProps {
  onAuthSuccess?: () => void;
  email?: string;
}

export function PasskeySignIn({ onAuthSuccess, email }: PasskeySignInProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [deviceNonce, setDeviceNonce] = useState<string | null>(null);
  const { setToast } = useToasts();

  // Load stored device nonce on component mount
  useEffect(() => {
    const storedNonce = localStorage.getItem("deviceNonce");
    if (storedNonce) {
      setDeviceNonce(storedNonce);
    }
  }, []);

  // Use a more forceful redirect approach
  const hardRedirect = (path: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/#${path}`;

    console.log("Performing hard redirect to:", url);

    // Set a flag so we know we're in a redirect
    localStorage.setItem("redirectingNow", "true");

    try {
      // Use a global variable to track redirect status
      (window as any).__redirectStatus = "pending";

      // Technique 1: Use replace
      window.location.replace(url);

      // Technique 2: If we're still here, try href assignment
      setTimeout(() => {
        if ((window as any).__redirectStatus === "pending") {
          console.log("Replace didn't work, trying direct href");
          window.location.href = url;
        }
      }, 100);

      // Technique 3: If still here, reload page and append the hash
      setTimeout(() => {
        if ((window as any).__redirectStatus === "pending") {
          console.log("Href didn't work, trying reload + hash");
          window.location.href = url;
          window.location.reload();
        }
      }, 300);

      // Emergency approach: Direct page navigation with new window
      setTimeout(() => {
        if ((window as any).__redirectStatus === "pending") {
          console.log("Emergency approach: open new window");
          const newWindow = window.open(url, "_self");
          if (newWindow) {
            newWindow.focus();
          }
        }
      }, 500);
    } catch (error) {
      console.error("Error during hard redirect:", error);

      // Last resort: Use document.location
      document.location.href = url;
    }
  };

  const handlePasskeySignIn = async () => {
    try {
      setIsAuthenticating(true);

      // Start the authentication process
      const authenticationResult =
        await AuthenticationService.startPasskeyAuthentication(email);

      // Request the browser to perform the passkey authentication
      const assertionResponse = await startAuthentication({
        optionsJSON: authenticationResult.options
      });

      // Verify the authentication with the server
      const verificationResult =
        await AuthenticationService.verifyPasskeyAuthentication({
          credentialId: assertionResponse.id,
          authenticatorData: assertionResponse.response.authenticatorData,
          clientDataJSON: assertionResponse.response.clientDataJSON,
          signature: assertionResponse.response.signature,
          userHandle: assertionResponse.response.userHandle,
          challenge: authenticationResult.options.challenge,
          deviceNonce: deviceNonce || undefined
        });

      // Authentication successful
      if (verificationResult.verified) {
        // Store the new device nonce for future authentications
        if (verificationResult.deviceNonce) {
          localStorage.setItem("deviceNonce", verificationResult.deviceNonce);
          setDeviceNonce(verificationResult.deviceNonce);
          console.log("Stored device nonce:", verificationResult.deviceNonce);
        }

        // Store session information if available
        if (verificationResult.sessionId) {
          localStorage.setItem("sessionId", verificationResult.sessionId);
          localStorage.setItem("userId", verificationResult.userId);
          console.log(
            "Session established with ID:",
            verificationResult.sessionId
          );

          // Set a flag to indicate that we need to initialize wallet shares
          localStorage.setItem("needsWalletActivation", "true");
          // Set flag for custom auth to help with provider detection
          localStorage.setItem("isCustomAuth", "true");
          console.log("Set isCustomAuth flag for passkey authentication");
        }

        setToast({
          type: "success",
          content: "Successfully signed in with passkey",
          duration: 1000
        });

        console.log("Authentication successful, preparing redirect...");

        // Update the navigation in the success block
        if (onAuthSuccess) {
          console.log("Calling onAuthSuccess callback");
          onAuthSuccess();
        } else {
          console.log("No callback provided, using hard redirect");

          // Slight delay before redirect
          setTimeout(() => {
            hardRedirect("/auth/restore-shares");
          }, 1000);
        }
      } else {
        setToast({
          type: "error",
          content: "Passkey authentication failed",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error authenticating with passkey:", error);
      setToast({
        type: "error",
        content: "Error authenticating with passkey",
        duration: 3000
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Wrapper>
      <PasskeyInfo>
        <Icon color="primary" as={Shield01} />
        <div>
          <Text size="md" weight="medium" noMargin>
            Sign in with Passkey
          </Text>
          <Text size="sm" variant="secondary" noMargin>
            Use your device biometrics or PIN for secure access
          </Text>
        </div>
      </PasskeyInfo>
      <Button
        fullWidth
        onClick={handlePasskeySignIn}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? "Authenticating..." : "Sign in with Passkey"}
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PasskeyInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background-color: rgba(${(props) => props.theme.primaryText}, 0.04);
  border-radius: 8px;
`;

const Icon = styled(Shield01)<{ color?: "primary" | "secondary" | "tertiary" }>`
  height: 24px;
  width: 24px;
  margin-top: 2px;
  color: ${({ theme, color }) =>
    color ? theme[`${color}Text`] : theme.primaryText};
`;
