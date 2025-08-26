import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { Routes } from "~wallets/router/routes.component";
import { Router as Wouter } from "wouter";
import { IFRAME_ROUTES } from "~wallets/router/iframe/iframe.routes";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { useEmbeddedLocation } from "~wallets/router/iframe/iframe-router.hook";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@wanderapp/core";
import { StyledComponentsThemeProvider, ThemeProvider, ThemeSetup } from "@wanderapp/ui";

import "react-toastify/dist/ReactToastify.css";
import { EmbeddedProvider } from "../utils/embedded.provider";

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
