import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Card, Upload, Button, WanderFooter, Text } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useToasts } from "@arconnect/components-rebrand";

export function AuthRestoreSharesRecoveryFileEmbeddedView() {
  const { navigate, back } = useLocation();
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
    if (!jsonData) return;
    try {
      setLoading(true);
      await recoverWallet(jsonData);
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [jsonData, recoverWallet]);

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

  return (
    <Card
      headerText="Import Recovery file"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate("/auth/restore-shares")}
      size="auto">
      <Upload
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your recovery file"}
        onFileParse={handleJsonParse}
      />
      <Button isFullWidth size="md" isLoading={loading} isDisabled={!jsonData} onClick={handleRestore}>
        Restore
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
