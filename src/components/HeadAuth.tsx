import type React from "react";
import { useEffect, useState } from "react";
import styled, { type DefaultTheme } from "styled-components";
import type { AppInfo, AppLogoInfo } from "~applications/application";
import Application from "~applications/application";
import HeadV2 from "~components/popup/HeadV2";
import { useAuthRequests } from "~utils/auth/auth.hooks";
import type { AuthRequestStatus } from "~utils/auth/auth.types";
import browser from "webextension-polyfill";
import { generateLogoPlaceholder } from "~utils/urls/getAppIconPlaceholder";

export interface HeadAuthProps {
  title?: string;
  back?: () => void;
  appInfo?: AppInfo;
  showHead?: boolean;
}

export const HeadAuth: React.FC<HeadAuthProps> = ({
  title,
  back,
  appInfo: appInfoProp = { name: "Wander" },
  showHead = true
}) => {
  const [areLogsExpanded, setAreLogsExpanded] = useState(false);
  const { authRequests, currentAuthRequestIndex, setCurrentAuthRequestIndex } =
    useAuthRequests();

  // Load the AppInfo to get the logo of the application. Note that data is not available to `Application` until
  // `/src/routes/auth/connect.tsx` calls `addApp()`, so the `appInfo` prop (`appInfoProp`) is used as initial /
  // fallback value:

  const { name: fallbackName, logo: fallbackLogo } = appInfoProp;
  const {
    tabID = null,
    url = "",
    type
  } = authRequests[currentAuthRequestIndex] || {};
  const isConnectType = type === "connect";
  const [appLogoInfo, setAppLogoInfo] = useState<AppLogoInfo>(appInfoProp);

  useEffect(() => {
    async function loadAppInfo() {
      if (!url || isConnectType) return;

      const app = new Application(url);
      const appInfo = await app.getAppData();
      const appLogoPlaceholder = await generateLogoPlaceholder(url);

      setAppLogoInfo({
        name:
          appInfo.name ||
          fallbackName ||
          new URL(url).hostname.split(".").slice(-2).join("."),
        logo: appInfo.logo || fallbackLogo,
        type: appLogoPlaceholder?.type,
        placeholder: appLogoPlaceholder?.placeholder
      });
    }

    loadAppInfo();
  }, [url, fallbackName, fallbackLogo, isConnectType]);

  const handleAppInfoClicked = tabID
    ? () => {
        if (tabID === null) return;

        browser.tabs.update(tabID, { active: true });
      }
    : undefined;

  // TODO: Add horizontal scroll to `DivTransactionsList` / `ButtonTransactionButton`.

  return (
    <>
      {showHead && (
        <HeadV2
          title={title}
          showOptions={isConnectType}
          showBack={!!back}
          back={back}
          appInfo={!isConnectType && appLogoInfo}
          onAppInfoClick={!isConnectType && handleAppInfoClicked}
        />
      )}

      {process.env.NODE_ENV === "development" && authRequests.length > 0 ? (
        <DivTransactionTracker>
          <DivTransactionsList>
            {process.env.NODE_ENV === "development" ? (
              <ButtonExpandLogs
                onClick={() =>
                  setAreLogsExpanded(
                    (prevAreLogsExpanded) => !prevAreLogsExpanded
                  )
                }
              />
            ) : null}

            {authRequests.map((authRequest, i) => (
              <ButtonTransactionButton
                key={authRequest.authID}
                isCurrent={i === currentAuthRequestIndex}
                status={authRequest.status}
                onClick={() => setCurrentAuthRequestIndex(i)}
              />
            ))}

            <DivTransactionButtonSpacer />
          </DivTransactionsList>

          {process.env.NODE_ENV === "development" && areLogsExpanded ? (
            <DivLogWrapper>
              {authRequests.map((authRequest, i) => {
                if (authRequest.type === "sign") {
                  // TODO: Consider removing `authRequest.transaction.data` if large
                } else if (authRequest.type === "signKeystone") {
                  // TODO: Consider removing `authRequest.data` if large.
                }

                return (
                  <PreLogItem
                    key={authRequest.authID}
                    isCurrent={i === currentAuthRequestIndex}
                    status={authRequest.status}
                  >
                    {JSON.stringify(authRequest, null, "  ")}
                  </PreLogItem>
                );
              })}
            </DivLogWrapper>
          ) : null}
        </DivTransactionTracker>
      ) : null}
    </>
  );
};

const DivTransactionTracker = styled.div`
  position: relative;
`;

const DivTransactionsList = styled.div`
  position: relative;
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid
    ${({ theme }) =>
      theme.displayTheme === "dark" ? "rgb(31, 30, 47)" : "rgb(224, 225, 208)"};
  height: 12px;
`;

interface AuthRequestIndicatorProps {
  isCurrent: boolean;
  status: AuthRequestStatus;
  theme: DefaultTheme;
}

const colorsByStatus: Record<
  AuthRequestStatus,
  { light: string; dark: string }
> = {
  pending: { light: "black", dark: "white" },
  accepted: { light: "green", dark: "green" },
  rejected: { light: "red", dark: "red" },
  aborted: { light: "grey", dark: "grey" },
  error: { light: "red", dark: "red" }
};

function getAuthRequestButtonIndicatorBorderColor({
  status,
  theme
}: AuthRequestIndicatorProps) {
  return theme.displayTheme === "dark"
    ? colorsByStatus[status].dark
    : colorsByStatus[status].light;
}

function getAuthRequestButtonIndicatorBackgroundColor({
  isCurrent,
  status,
  theme
}: AuthRequestIndicatorProps) {
  return isCurrent
    ? theme.displayTheme === "dark"
      ? colorsByStatus[status].dark
      : colorsByStatus[status].light
    : "transparent";
}

const ButtonTransactionButton = styled.button<AuthRequestIndicatorProps>`
  border: 2px solid ${getAuthRequestButtonIndicatorBorderColor};
  background: ${getAuthRequestButtonIndicatorBackgroundColor};
  border-radius: 128px;
  min-width: 20px;
  height: 100%;
  cursor: pointer;
`;

const DivTransactionButtonSpacer = styled.button`
  background: ${({ theme }) =>
    theme.displayTheme === "dark"
      ? "rgba(255, 255, 255, 0.125)"
      : "rgba(0, 0, 0, 0.125)"};
  border-radius: 128px;
  flex: 1 0 auto;
`;

const ButtonExpandLogs = styled.button`
  border: 2px solid
    ${({ theme }) => (theme.displayTheme === "dark" ? "white" : "black")};
  border-radius: 128px;
  width: 12px;
`;

const DivLogWrapper = styled.div`
  position: absolute;
  background: ${({ theme }) =>
    theme.displayTheme === "dark" ? "black" : "white"};
  top: 100%;
  left: 0;
  right: 0;
  height: 50vh;
  overflow: scroll;
  z-index: 1;
  border-bottom: 1px solid
    ${({ theme }) =>
      theme.displayTheme === "dark" ? "rgb(31, 30, 47)" : "rgb(224, 225, 208)"};
`;

function getAuthRequestLogIndicatorStyles(props: AuthRequestIndicatorProps) {
  let styles = "";

  styles += `background: ${getAuthRequestButtonIndicatorBorderColor(props)};`;

  if (!props.isCurrent) styles += "opacity: 0.25;";

  return styles;
}

const PreLogItem = styled.pre<AuthRequestIndicatorProps>`
  position: relative;
  padding: 16px 16px 16px 32px;
  color: ${(props) => props.theme.primaryText};

  &::before {
    content: "";
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 16px;
    width: 4px;
    border-radius: 128px;
    transform: translate(-50%, 0);
    ${getAuthRequestLogIndicatorStyles};
  }

  & + & {
    border-top: 1px solid rgb(31, 30, 47);
  }
`;
