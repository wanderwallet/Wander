import { useState } from "react";
import { Card, Box, Button, Radio } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

type PermissionsProps = {
  name: string;
  description: string;
  isChecked: boolean;
  handleChange: (e: React.MouseEvent<HTMLInputElement>) => void;
};

export function WalletSettingsCustomEmbeddedView() {
  const { navigate } = useLocation();
  const [permissions, setPermissions] = useState<PermissionsProps[]>([]);
  //TODO: create a hook or any other method to derive the permissions from the wallet
  return (
    <Card
      size="auto"
      headerText="Custom Permissions"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet/settings")}
      style={{ padding: "2rem" }}
    >
      <Box>
        {permissions.map((permission) => (
          <Radio
            label={permission.name}
            description={permission.description}
            isChecked={permission.isChecked}
            handleChange={permission.handleChange}
          />
        ))}
      </Box>
      <Button variant="primary" isFullWidth href="/wallet">
        Confirm
      </Button>
      <Button variant="outlined" isFullWidth href="/wallet">
        Cancel
      </Button>
    </Card>
  );
}
