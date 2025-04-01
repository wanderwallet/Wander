import { useEffect } from "react";
import { WanderThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { NavigationBar } from "~components/popup/Navigation";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { Routes } from "~wallets/router/routes.component";
import { Router as Wouter } from "wouter";
import { IFRAME_ROUTES } from "~wallets/router/iframe/iframe.routes";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { useEmbeddedLocation } from "~wallets/router/iframe/iframe-router.hook";
import { EmbeddedProvider } from "~utils/embedded/embedded.provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "~components/embed/contexts/ThemeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000,
      refetchInterval: 300_000,
      retry: 2,
      refetchOnWindowFocus: true
    }
  }
});

export function ArConnectEmbeddedApp() {
  useEffect(() => {
    handleSyncLabelsAlarm();
  }, []);

  return (
    <>
      <Routes routes={IFRAME_ROUTES} diffLocation />
      <NavigationBar />
    </>
  );
}

export function ArConnectEmbeddedAppRoot() {
  return (
    <WanderThemeProvider>
      <ThemeProvider>
        <EmbeddedProvider>
          <AuthRequestsProvider>
            <QueryClientProvider client={queryClient}>
              <Wouter hook={useEmbeddedLocation}>
                <ArConnectEmbeddedApp />
              </Wouter>
            </QueryClientProvider>
          </AuthRequestsProvider>
        </EmbeddedProvider>
      </ThemeProvider>
    </WanderThemeProvider>
  );
}
