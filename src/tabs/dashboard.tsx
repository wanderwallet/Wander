import { useHashLocation } from "wouter/use-hash-location";
import { Router as Wouter, Route as Woute } from "wouter";

import { SettingsDashboardView } from "~routes/dashboard";
import { WanderThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useEffect } from "react";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { WalletsProvider } from "~utils/wallets/wallets.provider";
import { ErrorBoundary } from "~utils/error/ErrorBoundary/errorBoundary";
import { FallbackView } from "~components/page/common/Fallback/fallback.view";

export function DashboardApp() {
  useEffect(() => {
    handleSyncLabelsAlarm();
  }, []);

  return (
    <Woute path="/:setting?/:subsetting?" component={SettingsDashboardView} />
  );
}

export function DashboardAppRoot() {
  return (
    <WanderThemeProvider>
      <ErrorBoundary fallback={FallbackView}>
        <WalletsProvider>
          <Wouter hook={useHashLocation}>
            <DashboardApp />
          </Wouter>
        </WalletsProvider>
      </ErrorBoundary>
    </WanderThemeProvider>
  );
}

export default DashboardAppRoot;
