import { Spacer, Text } from "@arconnect/components";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { permissionData, type PermissionType } from "~applications/permissions";
import Checkbox from "~components/Checkbox";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { ErrorTypes } from "~utils/error/error.utils";
import { LoadingView } from "~components/page/common/loading/loading.view";

export interface AppPermissionsViewParams {
  url: string;
}

export type AppPermissionsViewProps =
  CommonRouteProps<AppPermissionsViewParams>;

export function AppPermissionsView({
  params: { url }
}: AppPermissionsViewProps) {
  const { navigate } = useLocation();

  // app settings
  const app = new Application(decodeURIComponent(url));
  const [settings, updateSettings] = app.hook();

  if (!settings) {
    return <LoadingView />;
  }

  return (
    <>
      <HeadV2
        title={settings?.name || settings?.url}
        back={() => navigate(`/quick-settings/apps/${url}`)}
      />
      <Wrapper>
        <Title noMargin>{browser.i18n.getMessage("permissions")}</Title>
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
                    size={16}
                    onChange={(checked) =>
                      updateSettings((val) => {
                        // toggle permission
                        if (
                          checked &&
                          !val.permissions.includes(permissionName)
                        ) {
                          val.permissions.push(permissionName);
                        } else if (!checked) {
                          val.permissions = val.permissions.filter(
                            (p) => p !== permissionName
                          );
                        }

                        return val;
                      })
                    }
                    checked={settings.permissions.includes(permissionName)}
                  />
                  <div>
                    <PermissionTitle>{formattedPermissionName}</PermissionTitle>
                    <PermissionDescription>
                      {browser.i18n.getMessage(permissionData[permissionName])}
                    </PermissionDescription>
                  </div>
                </Permission>
                {i !== Object.keys(permissionData).length - 1 && (
                  <Spacer y={0.8} />
                )}
              </div>
            );
          }
        )}
        <Spacer y={1} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  padding: 0 1rem;
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
  font-size: 1.125rem;
`;

const Permission = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PermissionDescription = styled(Text).attrs({
  noMargin: true
})`
  margin-top: 0;
  font-size: 0.625rem;
`;

export const PermissionTitle = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  margin-top: 0.2rem;
  font-size: 0.875rem;
`;
