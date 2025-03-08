import { useState } from "react";
import Tokens from "./Tokens";
import Collectibles from "./Collectibles";
import Transactions from "./Transactions";
import Tabs from "~components/Tabs";

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState(0);

  // TODO: This could/should be implemented using a nested router:
  const tabs = [
    { id: 0, name: "assets", component: Tokens },
    { id: 1, name: "collectibles", component: Collectibles },
    { id: 2, name: "activity", component: Transactions }
  ] as const;

  return <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />;
}
