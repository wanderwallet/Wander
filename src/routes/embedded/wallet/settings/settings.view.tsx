import { useState, useEffect } from "react";
import { Card, Box, Button, Radio } from "~components/embed/ui";
import type { ConnectAuthRequestMessageData } from "~utils/auth/auth.types";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";

export function WalletSettingsEmbeddedView() {
  const { navigate, back, location } = useLocation();
  const searchParams = useSearchParams<{
    requestPayload?: string;
  }>();
  const [selectedPermission, setSelectedPermission] = useState<string>("");

  // Log component mount and params for debugging
  useEffect(() => {
    console.log("Settings view mounted", { searchParams, location });
    console.log("URL hash:", window.location.hash);
    console.log("Search params:", window.location.search);
  }, []);

  const handlePermissionChange = (permission: string) => {
    setSelectedPermission(permission);
    console.log("Permission selected:", permission);
  };

  // Create URL for custom permissions navigation
  const customPermissionsUrl = (() => {
    if (!searchParams.requestPayload) return "#/wallet/settings/custom";
    return `#/wallet/settings/custom?requestPayload=${encodeURIComponent(
      searchParams.requestPayload
    )}`;
  })();

  // Create URL for wallet navigation
  const walletUrl = "#/wallet";

  return (
    <Card
      size="auto"
      headerText="Confirm permissions"
      hasBackButton={true}
      onBackButtonClick={back}
      style={{ padding: "2rem" }}
    >
      <Box alignment="left">
        <Radio
          label="Always ask"
          isChecked={selectedPermission === "always-ask"}
          handleChange={() => handlePermissionChange("always-ask")}
        />
        <Radio
          label="Ask when spending"
          isChecked={selectedPermission === "when-spending"}
          handleChange={() => handlePermissionChange("when-spending")}
        />
        <Radio
          label="Auto-confirm"
          isChecked={selectedPermission === "auto-confirm"}
          handleChange={() => handlePermissionChange("auto-confirm")}
        />
        <Radio
          label="Custom permissions set"
          isChecked={selectedPermission === "custom-permissions"}
          handleChange={() => handlePermissionChange("custom-permissions")}
        />
      </Box>

      {selectedPermission === "custom-permissions" ? (
        <Button
          variant="primary"
          isFullWidth
          href={customPermissionsUrl}
          isDisabled={!selectedPermission}
        >
          Confirm
        </Button>
      ) : (
        <Button
          variant="primary"
          isFullWidth
          href={walletUrl}
          isDisabled={!selectedPermission}
        >
          Confirm
        </Button>
      )}
      <Button variant="outlined" isFullWidth href={walletUrl}>
        Cancel
      </Button>
    </Card>
  );
}
