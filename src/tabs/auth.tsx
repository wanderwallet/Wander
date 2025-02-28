import { WanderThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { Routes } from "~wallets/router/routes.component";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import { AUTH_ROUTES } from "~wallets/router/auth/auth.routes";
import { Router as Wouter } from "wouter";
import { WalletsProvider } from "~utils/wallets/wallets.provider";
import { useExtensionStatusOverride } from "~wallets/router/extension/extension-router.hook";
import { useEffect } from "react";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { ErrorBoundary } from "~utils/error/ErrorBoundary/errorBoundary";
import { FallbackView } from "~components/page/common/Fallback/fallback.view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

export function AuthApp() {
  useEffect(() => {
    handleSyncLabelsAlarm();
  }, []);

  return <Routes routes={AUTH_ROUTES} diffLocation />;
}

export function AuthAppRoot() {
  return (
    <WanderThemeProvider>
      <ErrorBoundary fallback={FallbackView}>
        <WalletsProvider redirectToWelcome>
          <AuthRequestsProvider useStatusOverride={useExtensionStatusOverride}>
            <QueryClientProvider client={queryClient}>
              <Wouter hook={useAuthRequestsLocation}>
                <AuthApp />
              </Wouter>
            </QueryClientProvider>
          </AuthRequestsProvider>
        </WalletsProvider>
      </ErrorBoundary>
    </WanderThemeProvider>
  );
}

export default AuthAppRoot;
