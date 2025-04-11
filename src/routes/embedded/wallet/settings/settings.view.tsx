import { useState } from "react";
import { Card, Box, Button, Radio } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function WalletSettingsEmbeddedView() {
  const { navigate, back } = useLocation();
  const [selectedPermission, setSelectedPermission] = useState<string>("");

  const handlePermissionChange = (permission: string) => {
    setSelectedPermission(permission);
  };

  const handleConfirm = () => {
    if (!selectedPermission) return;

    if (selectedPermission === "custom-permissions") {
      navigate("/wallet/settings/custom");
    } else {
      //TODO: update the permission in the wallet
      //TODO: navigate to the wallet page
      navigate("/wallet");
    }
  };

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

      <Button
        variant="primary"
        isFullWidth
        onClick={handleConfirm}
        isDisabled={!selectedPermission}
      >
        Confirm
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        onClick={() => navigate("/wallet")}
      >
        Cancel
      </Button>
    </Card>
  );
}
