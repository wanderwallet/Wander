import copy from "copy-to-clipboard";
import { useEffect, useState, useRef } from "react";
import {
  Avatar,
  Copyable,
  DownloadIcon,
  Row,
  Text,
  WalletIcon
} from "~components/embed/ui";
import { Shield01 } from "@untitled-ui/icons-react";
import Dropdown from "~components/embed/ui/molecules/dropdown/Dropdown/Dropdown";
import DropdownItem from "~components/embed/ui/molecules/dropdown/DropdownItem/DropdownItem";
import type { Wallet } from "~utils/embedded/embedded.types";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import { startRegistration } from "@simplewebauthn/browser";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import type { LocalWallet, StoredWallet } from "~wallets";
import type { HardwareWallet } from "~wallets/hardware";
import { setActiveWallet } from "~wallets/hooks";
import { Link } from "~wallets/router/components/link/Link";

// Simple loading spinner for passkey registration
const LoadingSpinner = () => (
  <div
    style={{
      width: "14px",
      height: "14px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "50%",
      borderTopColor: "white",
      animation: "spin 1s linear infinite"
    }}
  />
);

// Add the keyframes for the spinner animation
const spinnerStyle = document.createElement("style");
spinnerStyle.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

export function AccountSelector({
  wallets,
  activeWallet
}: {
  wallets?: StoredWallet[];
  activeWallet:
    | HardwareWallet
    | LocalWallet<string>
    | {
        address: string;
        nickname: string;
        type: string;
      };
}) {
  const { user, authProviderType } = useEmbedded();
  const [hasPasskeys, setHasPasskeys] = useState(true); // Default to true to hide the option
  const [isCheckingPasskeys, setIsCheckingPasskeys] = useState(true);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [showPasskeyOption, setShowPasskeyOption] = useState(false); // New state for explicit control

  // Track clicks on the document to know when to refresh passkey status
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user already has passkeys registered
  const checkUserPasskeys = async () => {
    try {
      setIsCheckingPasskeys(true);
      console.log("Checking for existing passkeys...");

      // If the user authenticated with passkeys, they obviously have a passkey
      if (authProviderType === "PASSKEYS") {
        console.log("User authenticated with passkeys, hiding passkey option");
        setHasPasskeys(true);
        setShowPasskeyOption(false);
        return;
      }

      // Check with the server
      const result = await AuthenticationService.checkUserPasskeys();
      console.log("Passkey check result:", result);

      // Only show the passkey option if we've confirmed the user doesn't have passkeys
      setShowPasskeyOption(!result.hasPasskeys);
      setHasPasskeys(result.hasPasskeys);
    } catch (error) {
      console.error("Error checking for passkeys:", error);
      setHasPasskeys(true); // Default to hiding the option on error
      setShowPasskeyOption(false);
    } finally {
      setIsCheckingPasskeys(false);
    }
  };

  // Check on initial load
  useEffect(() => {
    checkUserPasskeys();

    // Setup click listener to refresh passkey status when dropdown might be opened
    const handleClick = (event: MouseEvent) => {
      // Check if click is on or inside the dropdown component
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(event.target as Node)
      ) {
        // Refresh passkey status
        checkUserPasskeys();
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [authProviderType]);

  const handlePasskeyRegistration = async () => {
    if (!user?.email) {
      alert("You must be logged in to register a passkey");
      return;
    }

    try {
      setIsRegisteringPasskey(true);

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

      // Show success message
      alert("Passkey registered successfully!");

      // Update state to hide the option
      setHasPasskeys(true);
      setShowPasskeyOption(false);
    } catch (error) {
      console.error("Error registering passkey:", error);
      alert(
        "Error registering passkey: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleAccountClick = async (wallet: Wallet) => {
    return await setActiveWallet(wallet.address);
  };

  return (
    <div style={{ alignSelf: "flex-start" }} ref={dropdownRef}>
      <Dropdown
        backupReminder={
          <Link
            to="/account/backup-shares"
            style={{ textDecoration: "none", width: "100%" }}
          >
            <Row
              alignment="center"
              justifyContent="center"
              isFullWidth
              style={{
                padding: "8px 16px"
              }}
            >
              <Text variant="bodySm" style={{ fontWeight: 500 }}>
                Secure your account by backing it up.
              </Text>
              <DownloadIcon />
            </Row>
          </Link>
        }
        buttonAvatar={
          <Avatar fontColor={"#FFF"}>
            <WalletIcon color="#FFF" style={{ height: 16, width: 16 }} />
          </Avatar>
        }
        buttonText={
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            {activeWallet.nickname ?? activeWallet.address}
          </Text>
        }
        content={
          <>
            {/* Only show the passkey option if explicitly allowed */}
            {showPasskeyOption && !isCheckingPasskeys && (
              <DropdownItem
                onClick={
                  isRegisteringPasskey ? undefined : handlePasskeyRegistration
                }
              >
                <Row
                  alignment="center"
                  justifyContent="start"
                  style={{
                    padding: "8px 16px",
                    opacity: isRegisteringPasskey ? 0.7 : 1,
                    cursor: isRegisteringPasskey ? "not-allowed" : "pointer"
                  }}
                >
                  <Avatar fontColor={"#FFF"} backgroundColor="#5D5FEF">
                    {isRegisteringPasskey ? (
                      <LoadingSpinner />
                    ) : (
                      <Shield01
                        color="#FFF"
                        style={{ height: 16, width: 16 }}
                      />
                    )}
                  </Avatar>
                  <Text
                    variant="bodyMd"
                    style={{
                      fontWeight: 500,
                      color: "#121212",
                      width: "max-content"
                    }}
                  >
                    {isRegisteringPasskey
                      ? "Registering Passkey..."
                      : "Enable Passkey"}
                  </Text>
                </Row>
              </DropdownItem>
            )}
            {wallets.map((wallet, id) => (
              <DropdownItem key={id} onClick={handleAccountClick}>
                <Row
                  key={wallet.address}
                  alignment="center"
                  justifyContent="start"
                  style={{ padding: "8px 16px" }}
                >
                  <Avatar fontColor={"#FFF"}>
                    <WalletIcon
                      color="#FFF"
                      style={{ height: 16, width: 16 }}
                    />
                  </Avatar>
                  <Text
                    variant="bodyMd"
                    style={{
                      fontWeight: 500,
                      color: "#121212",
                      width: "max-content"
                    }}
                  >
                    {wallet.nickname ?? wallet.address}
                  </Text>
                  <Copyable
                    isButtonOnly
                    hasBorder={false}
                    value={wallet.address}
                    style={{
                      maxWidth: 140
                    }}
                    onClick={() => {
                      copy(wallet.address);
                    }}
                  />
                </Row>
              </DropdownItem>
            ))}
          </>
        }
      />
    </div>
  );
}
