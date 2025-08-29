import { useHashLocation } from "wouter/use-hash-location";
import { Router as Wouter, Route as Woute } from "wouter";
import { SettingsDashboardView } from "~routes/dashboard";
import { StyledComponentsThemeProvider } from "~utils/theme/styled-components/styled-components.provider";
import { useEffect } from "react";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { WalletsProvider } from "~utils/wallets/wallets.provider";
import { ErrorBoundary } from "../../../../libs/core-2/src/lib/utils/error/ErrorBoundary/errorBoundary";
import { FallbackView } from "~components/page/common/Fallback/fallback.view";
import { ThemeProvider } from "~utils/theme/theme.provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "~utils/tanstack";

export function DashboardApp() {
  useEffect(() => {
    handleSyncLabelsAlarm();
  }, []);

  return <Woute path="/:setting?/:subsetting?" component={SettingsDashboardView} />;
}

export function DashboardAppRoot() {
  return (
    <ThemeProvider>
      <StyledComponentsThemeProvider>
        <ErrorBoundary fallback={FallbackView}>
          <WalletsProvider>
            <QueryClientProvider client={queryClient}>
              <Wouter hook={useHashLocation}>
                <DashboardApp />
              </Wouter>
            </QueryClientProvider>
          </WalletsProvider>
        </ErrorBoundary>
      </StyledComponentsThemeProvider>
    </ThemeProvider>
  );
}

export default DashboardAppRoot;
