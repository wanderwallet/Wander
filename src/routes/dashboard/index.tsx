import {
  Card,
  Input,
  Spacer,
  Text,
  useInput
} from "@arconnect/components-rebrand";
import SettingListItem from "~components/dashboard/list/SettingListItem";
import { SettingsList } from "~components/dashboard/list/BaseElement";
import { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import { SettingDashboardView } from "~components/dashboard/Setting";
import {
  advancedSettings,
  allSettings,
  basicSettings,
  isDashboardRouteConfig,
  type DashboardRouteConfig
} from "~routes/dashboard/dashboard.constants";
import type Setting from "~settings/setting";
import {
  DASHBOARD_SUB_SETTING_ROUTES,
  type DashboardRoutePath
} from "~wallets/router/dashboard/dashboard.routes";
import { Redirect } from "~wallets/router/components/redirect/Redirect";
import { Routes } from "~wallets/router/routes.component";
import { HorizontalLine } from "~components/HorizontalLine";
import { Flex } from "~components/common/Flex";
import WanderIcon from "url:assets/icon.svg";
import IconText from "~components/IconText";
import Image from "~components/common/Image";

export interface SettingsDashboardViewParams {
  setting?: string;
  subsetting?: string;
}

export interface SettingsDashboardViewProps {
  params: SettingsDashboardViewParams;
}

export function SettingsDashboardView({ params }: SettingsDashboardViewProps) {
  const { navigate } = useLocation();
  const theme = useTheme();
  const { setting: activeSettingParam } = params;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchInput = useInput();

  const actualActiveSetting = useMemo(() => {
    return allSettings.find(({ name }) => name === activeSettingParam);
  }, [activeSettingParam]);

  const hasSubRoutes = useMemo(() => {
    return DASHBOARD_SUB_SETTING_ROUTES.some((route) =>
      route.path.startsWith(`/${actualActiveSetting?.name}/`)
    );
  }, [actualActiveSetting]);

  // search filter function
  const filterSearchResults = useMemo(() => {
    return (dashboardRouteConfig: DashboardRouteConfig | Setting) => {
      const query = searchInput.state;

      if (query === "" || !query) {
        return true;
      }

      return (
        dashboardRouteConfig.name.toLowerCase().includes(query.toLowerCase()) ||
        browser.i18n
          .getMessage(dashboardRouteConfig.displayName)
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    };
  }, [searchInput.state]);

  // Segment
  useEffect(() => {
    trackPage(PageType.SETTINGS);
  }, []);

  // Redirect to the first setting if none is selected:
  if (!actualActiveSetting) {
    return <Redirect to={`/${allSettings[0].name}` as DashboardRoutePath} />;
  }

  if (
    isDashboardRouteConfig(actualActiveSetting) &&
    !actualActiveSetting.component
  ) {
    throw new Error(
      `Missing component for ${actualActiveSetting.displayName} (${actualActiveSetting.name}) setting`
    );
  }

  return (
    <SettingsWrapper>
      <Panel normalPadding showRightBorder isMenu>
        <Flex gap={24} direction="column" padding="1rem 0.5rem">
          <Flex gap={10}>
            <Image
              src={WanderIcon}
              alt="Wander Icon"
              width={57.61}
              height={27}
            />
            <IconText width={116.759} height={24.111} />
          </Flex>
          <SettingsTitle>{browser.i18n.getMessage("settings")}</SettingsTitle>
        </Flex>

        <SettingsList>
          <Input
            fullWidth
            {...searchInput.bindings}
            sizeVariant="small"
            variant="search"
            placeholder={browser.i18n.getMessage("search")}
            inputContainerStyle={{ background: theme.backgroundv2 }}
          />
          <Spacer y={1} />
          {basicSettings.filter(filterSearchResults).map((setting, i) => (
            <SettingListItem
              theme={theme}
              displayName={setting.displayName}
              description={setting.description}
              icon={setting.icon}
              active={activeSettingParam === setting.name}
              onClick={() => navigate(`/${setting.name}` as DashboardRoutePath)}
              key={`basic-settings-${i}`}
            />
          ))}

          <AdvancedWrapper onClick={() => setShowAdvanced((prev) => !prev)}>
            <HorizontalLine />
            <Flex gap={4} align="center" justify="center">
              <Text
                style={{ whiteSpace: "nowrap" }}
                variant="secondary"
                size="xs"
                weight="medium"
                noMargin
              >
                {browser.i18n.getMessage(
                  showAdvanced ? "less_settings" : "more_settings"
                )}
              </Text>
              <Action as={showAdvanced ? ChevronUp : ChevronDown} />
            </Flex>
            <HorizontalLine />
          </AdvancedWrapper>

          {(showAdvanced || searchInput.state) &&
            advancedSettings
              .filter(filterSearchResults)
              .map((setting, i) => (
                <SettingListItem
                  theme={theme}
                  displayName={setting.displayName}
                  description={setting.description}
                  icon={setting.icon}
                  active={activeSettingParam === setting.name}
                  onClick={() =>
                    navigate(`/${setting.name}` as DashboardRoutePath)
                  }
                  key={`advanced-settings-${i}`}
                />
              ))}
        </SettingsList>
      </Panel>

      <MainContent direction="column" height="100%" width="100%">
        <HeaderFlex padding="2rem">
          <Flex gap={8} direction="column">
            <MidSettingsTitle>
              {browser.i18n.getMessage(actualActiveSetting?.displayName || "")}
            </MidSettingsTitle>
            <MidSettingsSubTitle>
              {browser.i18n.getMessage(actualActiveSetting?.description || "")}
            </MidSettingsSubTitle>
          </Flex>
        </HeaderFlex>
        <PanelContainer showTwoPanels={actualActiveSetting?.name !== "about"}>
          <Panel showRightBorder={hasSubRoutes}>
            {isDashboardRouteConfig(actualActiveSetting) ? (
              <actualActiveSetting.component />
            ) : (
              <SettingDashboardView
                key={activeSettingParam}
                setting={actualActiveSetting}
              />
            )}
          </Panel>

          {actualActiveSetting?.name !== "about" && (
            <Panel style={{ visibility: hasSubRoutes ? "visible" : "hidden" }}>
              <Routes
                routes={DASHBOARD_SUB_SETTING_ROUTES}
                diffLocation
                pageComponent={null}
              />
            </Panel>
          )}
        </PanelContainer>
      </MainContent>
    </SettingsWrapper>
  );
}

const SettingsWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100vh;
  overflow: hidden;

  @media screen and (max-width: 900px) {
    display: flex;
    flex-wrap: wrap;
    row-gap: 2rem;
    height: auto;
    overflow: visible;
  }
`;

const AdvancedWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 0;
  cursor: pointer;

  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const Action = styled(ChevronDown)`
  cursor: pointer;
  font-size: 1.25rem;
  width: 1rem;
  height: 1rem;
  color: ${(props) => props.theme.tertiaryText};
`;

const isMac = () => {
  const userAgent = navigator.userAgent;

  return userAgent.includes("Mac") && !userAgent.includes("Windows");
};

const Panel = styled.div<{
  normalPadding?: boolean;
  showRightBorder?: boolean;
  isMenu?: boolean;
}>`
  display: flex;
  flex-direction: column;
  border-radius: 0;
  ${({ showRightBorder, theme }) =>
    showRightBorder && `border-right: 1px solid ${theme.borderDefault}`};
  padding: ${(props) => (props.normalPadding ? "1.5rem 1rem" : "2rem")};
  box-sizing: border-box;

  ${(props) =>
    props.isMenu &&
    `
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 312px;
    overflow-y: auto;
    background: ${props.theme.surfaceSecondary};
  `}

  ${!isMac()
    ? `
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }`
    : ""}

  @media screen and (max-width: 900px) {
    position: static;
    width: 100%;

    ${(props) =>
      props.isMenu &&
      `
      height: 400px;  
      min-height: unset;
    `}

    &:nth-child(2) {
      border-right: 1px solid ${(props) => props.theme.borderDefault};
      height: 400px;
      min-height: unset;
    }
  }

  @media screen and (max-width: 645px) {
    border-right: none;
    border-bottom: 1px solid ${(props) => props.theme.borderDefault};

    ${(props) =>
      props.isMenu &&
      `
      height: 400px;  
    `}

    &:nth-child(2) {
      height: 400px;
    }

    &:last-child {
      border-bottom: none;
      height: auto;
      flex: 1;
    }
  }
`;

const SettingsTitle = styled(Text).attrs({
  size: "xl",
  weight: "bold",
  noMargin: true
})``;

const MidSettingsTitle = styled(Text).attrs({
  noMargin: true,
  size: "3xl",
  weight: "bold"
})`
  text-transform: capitalize;
`;

const PanelContainer = styled.div<{ showTwoPanels: boolean }>`
  flex: 1;
  width: 100%;
  display: grid;
  grid-template-columns: ${(props) =>
    props.showTwoPanels ? `1fr 1fr` : `1fr`};
  overflow: hidden;

  & > ${Panel} {
    overflow-y: auto;
    height: 100%;
    width: 100%;
  }

  @media screen and (max-width: 645px) {
    display: flex;
    flex-direction: column;
    height: auto;
    overflow: visible;

    & > ${Panel} {
      width: 100%;
    }
  }
`;

const MidSettingsSubTitle = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  variant: "secondary"
})``;

const MainContent = styled(Flex)`
  margin-left: 312px;
  flex: 1;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media screen and (max-width: 900px) {
    margin-left: 0;
    height: auto;
    overflow: visible;
  }
`;

const HeaderFlex = styled(Flex)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.borderDefault};
`;
