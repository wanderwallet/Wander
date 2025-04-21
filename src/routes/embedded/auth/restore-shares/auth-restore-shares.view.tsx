import {
  AppleIcon,
  Box,
  Button,
  Card,
  Row,
  WalletIcon,
  WanderIcon,
  Text,
  GDriveIcon,
  DropboxIcon,
  SeedIcon,
  KeyIcon
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect } from "react";

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

export function AuthRestoreSharesEmbeddedView() {
  const { recoverWallet } = useEmbedded();

  // Check for passkey authentication with auto wallet activation
  useEffect(() => {
    const needsWalletActivation =
      localStorage.getItem("needsWalletActivation") === "true";
    const sessionId = localStorage.getItem("sessionId");
    const userId = localStorage.getItem("userId");

    if (needsWalletActivation && sessionId && userId) {
      console.log("Automatic wallet activation from passkey authentication");
      // Clear the flag to prevent repeated activations
      localStorage.removeItem("needsWalletActivation");

      // Use the consistent redirect approach
      redirectToHash("/");
    }
  }, []);

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
        redirectToHash("/auth");
      }}
      size="auto"
    >
      <Box>
        <Button
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
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<DropboxIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          Dropbox
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<WalletIcon fontSize={24} />}
          href="#/auth/restore-shares/recovery-file"
        >
          Upload Account Recovery File
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
          href="#/auth/import-seedphrase"
        >
          Enter Seed Phrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          href="#/auth/import-keyfile"
        >
          Import Private Key
        </Button>
      </Box>
    </Card>
  );
}
