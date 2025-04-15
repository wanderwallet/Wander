import { useCallback, useMemo, useRef } from "react";
import { permissionData, type PermissionType } from "~applications/permissions";
import { Card, Box, Radio } from "~components/embed/ui";
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

  const permissions = useMemo(() => {
    return new Map(
      requestedPermissions.map((permission) => [permission, true])
    );
  }, [requestedPermissions]);

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

  return (
    <Card
      size="auto"
      headerText="Custom Permissions"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet/settings")}
      style={{ padding: "2rem 1rem" }}
    >
      <Box alignment="left" style={{ padding: 0 }}>
        {Object.keys(permissionData).map(
          (permissionName: PermissionType, i) => {
            let formattedPermissionName = permissionName
              .split("_")
              .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
              .join(" ");

            if (permissionName === "SIGNATURE") {
              formattedPermissionName = "Sign Data";
            }

            return (
              <Box
                style={{ padding: 0 }}
                alignment="left"
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePermissionChange(permissionName);
                }}
              >
                <Radio
                  key={i}
                  size={24}
                  label={formattedPermissionName}
                  description={browser.i18n.getMessage(
                    permissionData[permissionName]
                  )}
                  handleChange={() => {}}
                  isChecked={permissions.get(permissionName) ?? false}
                />
              </Box>
            );
          }
        )}
      </Box>
    </Card>
  );
}
