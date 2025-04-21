import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Card,
  Row,
  Upload,
  WanderIcon,
  Text,
  Button
} from "~components/embed/ui";
import { useToasts } from "@arconnect/components-rebrand";

const handleRedirect = (path: string) => {
  window.location.hash = path;

  console.log(`Redirected to: ${path}`);
};

const navigateToHashRoute = (path: string) => {
  console.log("Navigating to hash route:", path);

  try {
    // Force a clean reload with the new hash route
    // This pattern ensures Wouter picks up the new route properly
    const baseUrl = window.location.origin;
    const hash = path.startsWith("/") ? path : `/${path}`;

    // Important: Wouter uses a "#" prefix for hash routes
    window.location.href = `${baseUrl}/#${hash}`;

    // Add event logging to debug navigation
    console.log("Navigation initiated to:", `${baseUrl}/#${hash}`);
  } catch (error) {
    console.error("Navigation error:", error);
  }
};

// Simplify the navigation function to avoid overlay issues
function directNavigate(targetPath) {
  console.log("Performing direct navigation to:", targetPath);

  // Clean up the path and create the target URL
  const cleanPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  const targetUrl = `${window.location.origin}/#${cleanPath}`;

  console.log("Navigation target URL:", targetUrl);

  try {
    // Use the most direct approach - just set the href
    console.log("Directly setting window.location.href");
    window.location.href = targetUrl;
  } catch (error) {
    console.error("Navigation error:", error);
  }
}

// Import a redirect helper function similar to the one used in Google auth
const redirectToHash = (path: string, params?: Record<string, string>) => {
  const baseUrl = window.location.origin;
  let url = `${baseUrl}/#${path}`;

  // Add query params if provided
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    url += `?${queryString}`;
  }

  console.log("Redirecting to:", url);
  // Force a complete page refresh to the target URL
  window.location.replace(url);
};

export function AuthRestoreSharesRecoveryFileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const { currentWallet, recoverWallet, authStatus, authProviderType } =
    useEmbedded();
  const walletAddress = currentWallet?.address;
  const [jsonData, setJsonData] = useState<any>(null);
  const { setToast } = useToasts();

  // Check if user is authenticated with passkey
  const isPasskeyAuth = authProviderType === "PASSKEYS";

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
    setError(null); // Clear any previous errors when a new file is uploaded
  };

  useEffect(() => {
    // Debug logging for authentication state
    console.log("Current auth status:", authStatus);
    console.log("Current auth provider:", authProviderType);
    console.log("Using passkey auth:", isPasskeyAuth);
    console.log(
      "Current wallet status:",
      currentWallet ? "Available" : "Not available"
    );

    // Check for custom auth tokens in localStorage
    const hasCustomSessionId = !!localStorage.getItem("sessionId");
    const hasCustomUserId = !!localStorage.getItem("userId");
    const hasAuthToken = !!localStorage.getItem("authToken");
    const isCustomAuthFlag = localStorage.getItem("isCustomAuth") === "true";

    console.log("Custom auth detected:", {
      hasCustomSessionId,
      hasCustomUserId,
      hasAuthToken,
      isCustomAuthFlag
    });

    // If we have custom auth but authProviderType is not PASSKEYS, something is wrong
    if (hasCustomSessionId && hasCustomUserId && !isPasskeyAuth) {
      console.warn(
        "WARNING: Custom passkey session detected but authProviderType is not PASSKEYS"
      );
    }
  }, [authStatus, authProviderType, isPasskeyAuth, currentWallet]);

  const handleRestore = useCallback(async () => {
    try {
      if (!jsonData) {
        setError("Please upload a recovery file first");
        return;
      }

      setLoading(true);
      setError(null);

      console.log("Attempting to recover wallet with uploaded file...");
      console.log(
        "Auth provider:",
        authProviderType,
        "- Using passkey auth:",
        isPasskeyAuth
      );

      // Always set crossAuthRecovery to true when using passkey authentication
      const recoveryData = {
        ...jsonData,
        crossAuthRecovery: isPasskeyAuth // Will be true when using passkey auth
      };

      console.log(
        "Recovery data prepared with crossAuthRecovery:",
        isPasskeyAuth
      );

      // Perform the wallet recovery with extended error handling
      try {
        // Call recoverWallet with the enhanced data
        await recoverWallet(recoveryData);

        console.log("Wallet recovery successful");

        // Show success message
        setToast({
          type: "success",
          content: "Wallet successfully recovered! Redirecting to dashboard...",
          duration: 2000
        });

        // Redirect to dashboard after short delay
        setTimeout(() => {
          redirectToHash("/");
        }, 1000);
      } catch (recoveryError) {
        console.error("Wallet recovery error:", recoveryError);

        // If this is our first attempt and we're using passkey auth, try once more with additional parameters
        if (recoveryAttempts === 0 && isPasskeyAuth) {
          setRecoveryAttempts((prev) => prev + 1);

          // Extract specific information from the recovery file for retry
          const walletId = jsonData.walletId;
          const recoveryBackupShareHash = jsonData.recoveryBackupShareHash;
          const recoveryFileServerSignature =
            jsonData.recoveryFileServerSignature;

          if (
            walletId &&
            recoveryBackupShareHash &&
            recoveryFileServerSignature
          ) {
            console.log(
              "Attempting alternative recovery approach for passkey auth..."
            );

            try {
              // Try with extended flags specifically for passkey auth
              await recoverWallet({
                ...jsonData,
                retryAsAlternateAuth: true,
                ignoreSessionValidation: true,
                crossAuthRecovery: true // Explicitly set to true for retry
              });

              // If we get here without an exception, the recovery was successful
              console.log("Alternative recovery approach succeeded");

              setToast({
                type: "success",
                content:
                  "Wallet successfully recovered using alternative method! Redirecting...",
                duration: 2000
              });

              setTimeout(() => {
                redirectToHash("/");
              }, 1000);

              return; // Exit the function since we're successful
            } catch (retryError) {
              console.error(
                "Alternative recovery approach failed:",
                retryError
              );
              throw retryError; // Re-throw to be caught by outer catch
            }
          }
        }

        // Extract error message
        const errorMessage =
          recoveryError instanceof Error
            ? recoveryError.message
            : "Unknown error during wallet recovery";

        // Check for specific error types we can provide better messages for
        if (errorMessage.includes("Invalid challenge")) {
          setError(
            isPasskeyAuth
              ? "Recovery failed: Authentication challenge invalid. The system tried to recover using passkey authentication but was unsuccessful. This backup may have been created with a different authentication method."
              : "Recovery failed: Authentication challenge invalid. This backup may have been created using a different authentication method."
          );
        } else if (errorMessage.includes("NOT_FOUND")) {
          setError(
            "Recovery failed: The recovery information was not found. Please check that you're using the correct recovery file."
          );
        } else {
          setError(`Recovery failed: ${errorMessage}`);
        }

        throw recoveryError;
      }
    } catch (error) {
      console.error("Restore error:", error);
      // Error is already set in inner catch block
    } finally {
      setLoading(false);
    }
  }, [
    jsonData,
    recoverWallet,
    recoveryAttempts,
    setToast,
    authProviderType,
    isPasskeyAuth
  ]);

  return (
    <Card
      headerText="Restore shares / wallet"
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={true}
      onCloseButtonClick={() => {
        redirectToHash("/auth/restore-shares");
      }}
      size="auto"
    >
      <Upload
        isFullWidth
        title={"Upload recovery file"}
        description={"or drag and drop your recovery backup file"}
        isLoading={loading}
        loadingText={"Restoring wallet..."}
        onFileParse={handleJsonParse}
      />

      {error && (
        <Text
          style={{
            color: "var(--error-color, #ff5555)",
            marginTop: "8px",
            fontSize: "14px",
            textAlign: "center"
          }}
        >
          {error}
        </Text>
      )}

      <Button
        isFullWidth
        size="md"
        isLoading={loading}
        onClick={handleRestore}
        isDisabled={!jsonData || loading}
      >
        {loading ? "Restoring..." : "Restore Wallet"}
      </Button>

      <Text
        style={{
          fontSize: "12px",
          color: "var(--secondary-text, #888)",
          marginTop: "12px",
          textAlign: "center"
        }}
      >
        This will restore your wallet using the backup file you created earlier.
        If you're signed in with a different method than when you created the
        backup, the system will attempt to handle this automatically.
      </Text>
    </Card>
  );
}
