import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StyledComponentsThemeProvider } from "~utils/theme/styled-components/styled-components.provider";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { Routes } from "~wallets/router/routes.component";
import { Router as Wouter } from "wouter";

import { IFRAME_ROUTES } from "~wallets/router/iframe/iframe.routes";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { useEmbeddedLocation } from "~wallets/router/iframe/iframe-router.hook";
import { EmbeddedProvider } from "~utils/_embedded/embedded.provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeSetup } from "~components/embed/ui/atoms/theme-setup/ThemeSetup";
import { queryClient } from "~utils/tanstack";
import { ThemeProvider } from "~utils/theme/theme.provider";

export function WanderConnectApp() {
  useEffect(() => {
    handleSyncLabelsAlarm();
  }, []);

  return (
    <>
      <Routes routes={IFRAME_ROUTES} diffLocation />
      <ThemeSetup />
    </>
  );
}

export function WanderConnectAppRoot() {
  return (
    <ThemeProvider>
      <StyledComponentsThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Wouter hook={useEmbeddedLocation}>
            <EmbeddedProvider>
              <AuthRequestsProvider>
                <WanderConnectApp />
                <ToastContainer
                  position="top-center"
                  autoClose={2000}
                  hideProgressBar={false}
                  pauseOnFocusLoss={false}
                />
              </AuthRequestsProvider>
            </EmbeddedProvider>
          </Wouter>
        </QueryClientProvider>
      </StyledComponentsThemeProvider>
    </ThemeProvider>
  );
}
