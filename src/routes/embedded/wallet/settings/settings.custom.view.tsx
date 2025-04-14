import { useState, useEffect } from "react";
import { Card, Box, Button, Radio } from "~components/embed/ui";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";

type PermissionsProps = {
  name: string;
  description: string;
  isChecked: boolean;
  handleChange: (e: React.MouseEvent<HTMLInputElement>) => void;
};

// Maps permission keys to user-friendly display values
function getPermissionDisplay(permissionKey: string): string {
  const permissionMap: Record<string, string> = {
    ACCESS_ADDRESS: "Access Address",
    ACCESS_PUBLIC_KEY: "Access Public Key",
    ACCESS_ALL_ADDRESSES: "Access All Addresses",
    SIGN_TRANSACTION: "Sign Transaction",
    ENCRYPT: "Encrypt",
    DECRYPT: "Decrypt",
    SIGNATURE: "Signature",
    ACCESS_ARWEAVE_CONFIG: "Access Arweave Config",
    DISPATCH: "Dispatch",
    ACCESS_TOKENS: "Access Tokens"
  };

  return permissionMap[permissionKey] || permissionKey;
}

export function WalletSettingsCustomEmbeddedView() {
  const searchParams = useSearchParams<{ requestPayload?: string }>();
  const { navigate, location } = useLocation();
  const { requestPayload } = searchParams;

  // Log component mount and request payload
  useEffect(() => {
    console.log("Custom Settings view mounted", { requestPayload, location });
    console.log("URL hash:", window.location.hash);
    console.log("Search params:", window.location.search);
  }, []);

  // Create URLs for navigation
  const backUrl = "#/wallet/settings";
  const walletUrl = "#/wallet";

  // Parse the permissions from the request payload
  const permissions = (() => {
    try {
      if (!requestPayload) {
        console.error("No request payload provided");
        return [];
      }
      const parsed = JSON.parse(requestPayload);
      console.log("Parsed payload:", parsed);
      return parsed.permissions || [];
    } catch (error) {
      console.error("Failed to parse request payload:", error);
      return [];
    }
  })();

  return (
    <Card
      size="auto"
      headerText="Custom Permissions"
      hasBackButton={true}
      onBackButtonClick={() => (window.location.hash = backUrl)}
      style={{ padding: "2rem" }}
    >
      <Box>
        {Array.isArray(permissions) &&
          permissions.map((permission, index) => (
            <Radio
              key={index}
              label={getPermissionDisplay(
                typeof permission === "string" ? permission : permission.name
              )}
              description={
                typeof permission === "string" ? "" : permission.description
              }
              isChecked={
                typeof permission === "string" ? false : permission.isChecked
              }
              handleChange={
                typeof permission === "string"
                  ? () => {}
                  : permission.handleChange
              }
            />
          ))}
      </Box>
      <Button variant="primary" isFullWidth href={walletUrl}>
        Confirm
      </Button>
      <Button variant="outlined" isFullWidth href={walletUrl}>
        Cancel
      </Button>
    </Card>
  );
}
