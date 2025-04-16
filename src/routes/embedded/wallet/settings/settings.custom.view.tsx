import { useCallback, useMemo } from "react";
import { permissionData, type PermissionType } from "~applications/permissions";
import { Card, Box, Switch } from "~components/embed/ui";
import browser from "~iframe/browser";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useStorage, ExtensionStorage } from "~utils/storage";
import { useLocation } from "~wallets/router/router.utils";

export function WalletSettingsCustomEmbeddedView() {
  const { navigate } = useLocation();
  const { authRequest } = useCurrentAuthRequest("connect");

  const { url = "" } = authRequest;

  const [requestedPermissions, setRequestedPermissions] = useStorage<
    PermissionType[]
  >(
    {
      key: `requested_permissions_${url}`,
      instance: ExtensionStorage
    },
    []
  );

  const permissions = useMemo(
    () => new Map(requestedPermissions.map((permission) => [permission, true])),
    [requestedPermissions]
  );

  const handlePermissionChange = useCallback(
    (permission: PermissionType) => {
      const updated = new Map(permissions);
      updated.set(permission, !permissions.get(permission));

      const newPermissions = Array.from(updated.entries())
        .filter(([_, value]) => value)
        .map(([key]) => key);

      setRequestedPermissions(newPermissions);
    },
    [permissions, setRequestedPermissions]
  );

  const formatPermissionName = useCallback((permissionName: PermissionType) => {
    if (permissionName === "SIGNATURE") return "Sign Data";

    return permissionName
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent, permission: PermissionType) => {
      e.stopPropagation();
      e.preventDefault();
      handlePermissionChange(permission);
    },
    [handlePermissionChange]
  );

  return (
    <Card
      size="auto"
      headerText="Custom Permissions"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet/settings")}
      style={{ padding: "2rem 1rem" }}
    >
      <Box alignment="left" style={{ padding: 0, gap: 16 }}>
        {Object.keys(permissionData).map((permissionName: PermissionType) => (
          <Box
            style={{ padding: 0 }}
            alignment="left"
            key={permissionName}
            onClick={(e) => handleClick(e, permissionName)}
          >
            <Switch
              size={28}
              labelPosition="left"
              id={`checkbox-${permissionName}`}
              label={formatPermissionName(permissionName)}
              description={browser.i18n.getMessage(
                permissionData[permissionName]
              )}
              handleChange={(e) => {}}
              isChecked={permissions.get(permissionName) ?? false}
            />
          </Box>
        ))}
      </Box>
    </Card>
  );
}
