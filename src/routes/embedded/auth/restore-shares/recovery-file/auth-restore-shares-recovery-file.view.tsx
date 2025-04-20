import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useRef, useState } from "react";

import {
  Card,
  Row,
  Upload,
  WanderIcon,
  Text,
  Button
} from "~components/embed/ui";

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
  const { currentWallet, recoverWallet } = useEmbedded();
  const walletAddress = currentWallet.address;
  const [jsonData, setJsonData] = useState<any>(null);

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
  };

  const handleRestore = useCallback(async () => {
    try {
      setLoading(true);
      if (jsonData) {
        const restoredWallet = recoverWallet(jsonData);

        if (!restoredWallet) {
          setLoading(false);
          return alert(`Something isn't right`);
        }
        setLoading(false);
        return restoredWallet;
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [jsonData]);

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

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
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Restoring account..."}
        onFileParse={handleJsonParse}
      />
      <Button isFullWidth size="md" isLoading={loading} onClick={handleRestore}>
        Restore
      </Button>
    </Card>
  );
}
