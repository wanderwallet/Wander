import {
  Button,
  ListItem,
  Text,
  useToasts
} from "@arconnect/components-rebrand";
import styled from "styled-components";
import { useState, useEffect } from "react";
import browser from "webextension-polyfill";
import { startRegistration } from "@simplewebauthn/browser";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import { Shield01 } from "@untitled-ui/icons-react";
import { getSupabaseClient, trpcVanilla } from "~utils/embedded/embedded.utils";

interface PasskeySettingsProps {
  walletAddress: string;
}

export function PasskeySettings({ walletAddress }: PasskeySettingsProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const { setToast } = useToasts();

  // Check if user already has a passkey
  useEffect(() => {
    const checkForExistingPasskey = async () => {
      try {
        setIsLoading(true);

        // Check if the user has any passkeys via the API
        const result = await AuthenticationService.checkUserPasskeys();

        if (result.hasPasskeys) {
          console.log("API confirms user has passkeys");
          setHasPasskey(true);
        }
      } catch (error) {
        console.error("Error checking for existing passkey:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForExistingPasskey();
  }, []);

  const handleEnablePasskey = async () => {
    try {
      setIsRegistering(true);

      // Start the registration process
      const registrationResult =
        await AuthenticationService.startPasskeyRegistration();

      // Request the browser to create a passkey
      const attestationResponse = await startRegistration(
        registrationResult.options
      );

      // Verify the registration with the server
      const verificationResult =
        await AuthenticationService.verifyPasskeyRegistration(
          registrationResult.userId,
          attestationResponse
        );

      // Show the check email message
      setShowCheckEmail(true);

      setToast({
        type: "success",
        content: "Please check your email to complete passkey setup.",
        duration: 3000
      });
    } catch (error) {
      console.error("Error registering passkey:", error);
      setToast({
        type: "error",
        content: "Error registering passkey",
        duration: 3000
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // If still loading, show nothing
  if (isLoading) {
    console.log("PasskeySettings: Still loading...");
    return null;
  }

  // If user already has a passkey, hide the component
  if (hasPasskey) {
    console.log("PasskeySettings: User has passkey, hiding component");
    return null;
  }

  // If user needs to check their email to complete registration
  if (showCheckEmail) {
    console.log("PasskeySettings: Showing check email message");
    return (
      <Wrapper>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Text size="lg" weight="medium" noMargin>
            Security
          </Text>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <PasskeyInfo>
              <Icon color="primary" as={Shield01} />
              <div>
                <Text size="md" weight="medium" noMargin>
                  Check Your Email
                </Text>
                <Text size="sm" variant="secondary" noMargin>
                  We've sent you an email to complete your passkey setup
                </Text>
              </div>
            </PasskeyInfo>
          </div>
        </div>
      </Wrapper>
    );
  }

  console.log("PasskeySettings: Showing enable passkey interface");
  return (
    <Wrapper>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Text size="lg" weight="medium" noMargin>
          Security
        </Text>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <PasskeyInfo>
            <Icon color="primary" as={Shield01} />
            <div>
              <Text size="md" weight="medium" noMargin>
                Enable Passkey
              </Text>
              <Text size="sm" variant="secondary" noMargin>
                Securely access your wallet using biometrics or device PIN
              </Text>
            </div>
          </PasskeyInfo>
          <Button
            fullWidth
            onClick={handleEnablePasskey}
            disabled={isRegistering}
          >
            {isRegistering ? "Registering Passkey..." : "Enable Passkey"}
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  margin-top: 1.5rem;
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
