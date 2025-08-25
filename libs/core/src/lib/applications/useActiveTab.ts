import browser, { type Tabs } from "webextension-polyfill";
import { getActiveTab } from "~applications";
import { useState } from "react";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";

export default function useActiveTab() {
  const [activeTab, setActiveTab] = useState<Tabs.Tab>();

  useAsyncEffect(async () => {
    // listener for active tab
    const fetchActiveTab = async () => {
      const tab = await getActiveTab();

      setActiveTab(tab);
    };

    // load current tab
    await fetchActiveTab();

    // listen for changes
    browser.tabs.onUpdated.addListener(fetchActiveTab);

    return () => browser.tabs.onUpdated.removeListener(fetchActiveTab);
  }, []);

  return activeTab;
}
