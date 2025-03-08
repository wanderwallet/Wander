import { Spacer, Text, useInput } from "@arconnect/components-rebrand";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { SettingsList } from "./list/BaseElement";
import { useRoute } from "wouter";
import Application from "~applications/application";
import AppListItem from "./list/AppListItem";
import browser from "webextension-polyfill";
import SearchInput from "./SearchInput";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface ApplicationsDashboardViewParams {
  app?: string;
}

export type ApplicationsDashboardViewProps =
  CommonRouteProps<ApplicationsDashboardViewParams>;

export function ApplicationsDashboardView() {
  const { navigate } = useLocation();
  // TODO: Replace with useParams:
  const [, params] = useRoute<{ app?: string }>("/apps/:app?");

  // connected apps
  const [connectedApps] = useStorage<string[]>(
    {
      key: "apps",
      instance: ExtensionStorage
    },
    []
  );

  // apps
  const [apps, setApps] = useState<SettingsAppData[]>([]);

  useEffect(() => {
    (async () => {
      if (!connectedApps) return;
      const appsWithData: SettingsAppData[] = [];

      for (const app of connectedApps) {
        const appObj = new Application(app);
        const appData = await appObj.getAppData();

        appsWithData.push({
          name: appData.name || app,
          url: app,
          icon: appData.logo
        });
      }

      setApps(appsWithData);
    })();
  }, [connectedApps]);

  // active subsetting val
  const activeApp = useMemo(
    () => (params?.app ? decodeURIComponent(params.app) : undefined),
    [params]
  );

  useEffect(() => {
    const firstApp = connectedApps?.[0];

    if (!firstApp || (!!activeApp && !!connectedApps.includes(activeApp))) {
      return;
    }

    navigate(`/apps/${firstApp}`);
  }, [connectedApps]);

  // search
  const searchInput = useInput();

  // search filter function
  function filterSearchResults(app: SettingsAppData) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.url.toLowerCase().includes(query.toLowerCase())
    );
  }

  return (
    <Wrapper>
      <SearchWrapper>
        <SearchInput
          placeholder={browser.i18n.getMessage("search_apps")}
          {...searchInput.bindings}
        />
      </SearchWrapper>
      <Spacer y={1} />
      <SettingsList>
        {apps.filter(filterSearchResults).map((app, i) => (
          <AppListItem
            name={app.name}
            url={app.url}
            icon={app.icon}
            active={activeApp === app.url}
            onClick={() => navigate(`/apps/${encodeURIComponent(app.url)}`)}
            squircleSize={40}
            style={{ height: 64 }}
            showArrow
            key={i}
          />
        ))}
      </SettingsList>
      {connectedApps && connectedApps.length === 0 && (
        <NoAppsText>{browser.i18n.getMessage("no_apps_added")}</NoAppsText>
      )}
    </Wrapper>
  );
}

interface SettingsAppData {
  name: string;
  url: string;
  icon?: string;
}

const Wrapper = styled.div`
  position: relative;
`;

const SearchWrapper = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background-color: rgb(${(props) => props.theme.cardBackground});
`;

const NoAppsText = styled(Text)`
  text-align: center;
  padding-top: 0.5rem;
`;
