import { Spacer, Text, useInput } from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import AppListItem from "~components/dashboard/list/AppListItem";
import { SettingsList } from "~components/dashboard/list/BaseElement";
import SearchInput from "~components/dashboard/SearchInput";
import HeadV2 from "~components/popup/HeadV2";
import useActiveTab from "~applications/useActiveTab";
import { getAppURL } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";

interface SettingsAppData {
  name: string;
  url: string;
  icon?: string;
}

export function ApplicationsView() {
  const { navigate } = useLocation();

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

  // active app
  const activeTab = useActiveTab();
  const activeApp = useMemo<Application | undefined>(() => {
    if (!activeTab?.url) {
      return undefined;
    }

    return new Application(getAppURL(activeTab.url));
  }, [activeTab]);

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
    <>
      <HeadV2
        title={browser.i18n.getMessage("setting_apps")}
        back={() => navigate("/quick-settings")}
      />
      <Wrapper>
        <SearchWrapper>
          <SearchInput
            small
            placeholder={browser.i18n.getMessage("search_apps")}
            {...searchInput.bindings}
          />
        </SearchWrapper>
        <Spacer y={1} />
        <SettingsList>
          {apps.filter(filterSearchResults).map((app, i) => (
            <AppListItem
              small
              name={app.name}
              url={
                <>
                  {app.url === activeApp.url ? (
                    <ActiveText>
                      <AppOnline />
                      Active
                    </ActiveText>
                  ) : (
                    app.url
                  )}
                </>
              }
              icon={app.icon}
              active={false}
              onClick={() =>
                navigate(`/quick-settings/apps/${encodeURIComponent(app.url)}`)
              }
              key={i}
            />
          ))}
        </SettingsList>
        {connectedApps && connectedApps.length === 0 && (
          <NoAppsText>{browser.i18n.getMessage("no_apps_added")}</NoAppsText>
        )}
        <Spacer y={1} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
  padding: 0 1rem;
`;

const SearchWrapper = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
`;

const NoAppsText = styled(Text)`
  text-align: center;
  padding-top: 0.5rem;
`;

const AppOnline = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 100%;
  background-color: ${(props) => props.theme.success};
  border: 1px solid rgb(${(props) => props.theme.background});
`;

const ActiveText = styled(Text)`
  display: flex;
  align-items: center;
  font-size: 0.625rem;
  color: ${(props) => props.theme.success};
  gap: 4px;
`;
