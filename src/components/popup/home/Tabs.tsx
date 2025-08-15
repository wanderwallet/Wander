import { useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import Tokens from "./Tokens";
import Collectibles from "./Collectibles";
import Transactions from "./Transactions";
import Tabs from "~components/Tabs";

const TABS_CONFIG = [
  { id: 0, name: "assets", component: Tokens },
  { id: 1, name: "collectibles", component: Collectibles },
  { id: 2, name: "feed", component: Transactions },
] as const;

const TAB_PARAM_TO_ID = Object.fromEntries(TABS_CONFIG.map((tab) => [tab.name, tab.id])) as Record<string, number>;

export default function DashboardTabs() {
  const { navigate, location } = useLocation();
  const { tab } = useSearchParams<{ tab?: string }>();

  const activeTab = useMemo(() => TAB_PARAM_TO_ID[tab] ?? 0, [tab]);

  const setActiveTab = useCallback(
    (tabId: number) => {
      if (activeTab === tabId) return;

      const tabConfig = TABS_CONFIG[tabId];
      if (!tabConfig) return;

      navigate(location, { search: { tab: tabConfig.name } });
    },
    [navigate, location, activeTab],
  );

  return <Tabs tabs={TABS_CONFIG} activeTab={activeTab} setActiveTab={setActiveTab} />;
}
