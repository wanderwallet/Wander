import React, { useEffect } from "react";
import {
  Box,
  Button,
  Card,
  WalletIcon,
  SeedIcon,
  KeyIcon,
  WanderFooter
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

export function AuthRestoreSharesEmbeddedView() {
  const { navigate, back } = useLocation();
  const { authProviderType, authStatus } = useEmbedded();

  // Improved passkey authentication handling
  useEffect(() => {
    const needsWalletActivation = localStorage.getItem("needsWalletActivation") === "true";
    
    // We can determine if we're using passkeys by checking the auth context
    const isPasskeyAuth = authProviderType === "PASSKEYS";
    
    // Only proceed with automatic wallet activation if:
    // 1. We're using passkeys (from auth context)
    // 2. The needsWalletActivation flag is set (transitional - can be removed later)
    // 3. We're authenticated
    if (isPasskeyAuth && needsWalletActivation && authStatus !== "unknown" && authStatus !== "authLoading") {
      console.log("Automatic wallet activation from passkey authentication");
      
      // Clear the flag to prevent repeated activations
      localStorage.removeItem("needsWalletActivation");

      // Use the consistent redirect approach
      redirectToHash("/");
    }
  }, [authProviderType, authStatus]);

  // Helper function to redirect to a hash-based route
  const redirectToHash = (path) => {
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/#${path}`;
  };

  return (
    <Card
      headerText="Restore shares / wallet"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(`/auth`)}
      size="auto">
      <Box>
        {/* <Button
          variant="outlined"
          isFullWidth
          icon={<GDriveIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          Google Drive
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          iCloud
        </Button> */}
        {/* <Button
          variant="outlined"
          isFullWidth
          icon={<DropboxIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          Dropbox
        </Button> */}
        <Button
          variant="outlined"
          isFullWidth
          icon={<WalletIcon fontSize={24} />}
          href="#/auth/restore-shares/recovery-file">
          Import Recovery File
        </Button>
        <Button variant="outlined" isFullWidth icon={<SeedIcon fontSize={24} />} href="#/auth/import-seedphrase">
          Enter Seedphrase
        </Button>
        <Button variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />} href="#/auth/import-keyfile">
          Import keyfile
        </Button>
      </Box>
    </Card>
  );
}
