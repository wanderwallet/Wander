import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { Router as Wouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, AuthRequestsProvider, handleSyncLabelsAlarm } from "@wanderapp/core";
import { Routes, StyledComponentsThemeProvider, ThemeProvider, ThemeSetup } from "@wanderapp/ui";
import { EmbeddedProvider } from "../utils/embedded.provider";
import { IFRAME_ROUTES } from "../router/dashboard/iframe.routes";
import { useEmbeddedLocation } from "../router/dashboard/iframe-router.hook";

import "react-toastify/dist/ReactToastify.css";

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
