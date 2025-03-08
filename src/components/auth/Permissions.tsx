import { Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { permissionData, type PermissionType } from "~applications/permissions";
import Checkbox from "~components/Checkbox";
import { useEffect, useState } from "react";
import { AuthButtons } from "~components/auth/AuthButtons";
import type { ConnectAuthRequest } from "~utils/auth/auth.types";

type PermissionsProps = {
  connectAuthRequest: ConnectAuthRequest;
  requestedPermissions: PermissionType[];
  update: (updatedPermissions: PermissionType[]) => void;
  closeEdit: (setEdit: boolean) => void;
};

export default function Permissions({
  connectAuthRequest,
  requestedPermissions,
  update,
  closeEdit
}: PermissionsProps) {
  const [permissions, setPermissions] = useState<Map<PermissionType, boolean>>(
    new Map(requestedPermissions.map((permission) => [permission, true]))
  );

  return (
    <Wrapper>
      <div>
        <Section showPaddingVertical={false}>
          <Title noMargin>{browser.i18n.getMessage("permissions")}</Title>
          <PermissionsWrapper>
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
                  <div key={i}>
                    <Permission>
                      <Checkbox
                        size={20}
                        key={permissionName}
                        onChange={(checked) => {
                          const updated = new Map(permissions);
                          updated.set(permissionName, checked);
                          setPermissions(updated);
                        }}
                        checked={permissions.get(permissionName) ?? false}
                      />
                      <div>
                        <PermissionTitle>
                          {formattedPermissionName}
                        </PermissionTitle>
                        <PermissionDescription>
                          {browser.i18n.getMessage(
                            permissionData[permissionName]
                          )}
                        </PermissionDescription>
                      </div>
                    </Permission>
                  </div>
                );
              }
            )}
          </PermissionsWrapper>
        </Section>
      </div>

      <Section>
        <AuthButtons
          showAuthStatus={false}
          authRequest={connectAuthRequest}
          primaryButtonProps={{
            label: browser.i18n.getMessage("save"),
            onClick: () => {
              const updatedPermissions = Array.from(permissions.entries())
                .filter(([, value]) => value)
                .map(([key]) => key);
              update(updatedPermissions);
              closeEdit(false);
            }
          }}
        />
      </Section>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  width: 100vw;
  flex-direction: column;
  height: calc(100vh - 163px);
  justify-content: space-between;
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.75em;
  font-size: 1.125rem;
`;

const PermissionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Permission = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PermissionDescription = styled(Text).attrs({
  noMargin: true,
  size: "sm",
  weight: "medium"
})``;

export const PermissionTitle = styled(Text).attrs({
  noMargin: true,
  weight: "medium"
})``;
