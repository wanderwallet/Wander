import { useState } from "react";
import {
  Card,
  Box,
  Button,
  Radio,
  Snackbar,
  InfoIcon
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

type Requestor = {
  name: string;
  description: string;
  permissions: string[]; //TODO: define a list of permissions available for the requestor
  image: string;
};

export function WalletPermissionsRequestEmbeddedView() {
  const { navigate } = useLocation();
  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [selectedRequestor, setSelectedRequestor] = useState<Requestor>();

  const handlePermissionChange = (permission: string) => {
    setSelectedPermission(permission);
  };

  const handleConfirm = () => {
    if (!selectedPermission) return;

    if (selectedPermission === "custom-permissions") {
      navigate("/wallet/settings/custom");
    } else {
      //TODO: update the permission in the wallet
      navigate("/wallet");
    }
  };

  return (
    <Card
      size="auto"
      headerText="Confirm permissions"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "2rem" }}
    >
      <Box alignment="left">
        <Radio
          label="Always ask"
          isChecked={selectedPermission === "always-ask"}
          handleChange={() => handlePermissionChange("always-ask")}
        />
        <Radio
          label="Allow access to your walletAsk when spending"
          isChecked={selectedPermission === "allow-access"}
          handleChange={() => handlePermissionChange("allow-access")}
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
        <br />
        <br />
        <Snackbar
          text="Ask permissions for all interactions with your wallet."
          icon={<InfoIcon />}
          backgroundColor="var(--color-background-default)"
          iconColor="var(--color-font-body)"
          textColor="var(--color-font-body)"
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
