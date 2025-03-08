import { NavigationBar } from "~components/popup/Navigation";
import { WanderThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { Routes } from "~wallets/router/routes.component";
import { POPUP_ROUTES } from "~wallets/router/popup/popup.routes";
import { Router as Wouter } from "wouter";
import { useExtensionLocation } from "~wallets/router/extension/extension-router.hook";
import { WalletsProvider } from "~utils/wallets/wallets.provider";
import { useEffect, useState } from "react";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { ErrorBoundary } from "~utils/error/ErrorBoundary/errorBoundary";
import { FallbackView } from "~components/page/common/Fallback/fallback.view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExtensionStorage } from "~utils/storage";
import styled from "styled-components";
import { Section } from "@arconnect/components-rebrand";
import UpdateSplash from "~routes/welcome/UpdateSplash";
import StarIcons from "~components/welcome/StarIcons";

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

export function WanderBrowserExtensionApp() {
  const [showAnimation, setShowAnimation] = useState<boolean>(false);

  useEffect(() => {
    handleSyncLabelsAlarm();
  }, []);

  // To show update splash
  useEffect(() => {
    const showSplash = async () => {
      const isSplashScreenSeen = await ExtensionStorage.get(
        "update_splash_screen_seen"
      );

      // we need to make sure it's not undefined
      if (isSplashScreenSeen === undefined) return;

      if (!isSplashScreenSeen) {
        setShowAnimation(true);
        await ExtensionStorage.set("update_splash_screen_seen", true);
      }
      return;
    };
    showSplash();
  }, []);

  // To show update splash
  if (showAnimation) {
    return (
      <Wrapper>
        <Content>
          <StarIcons screen="unlock" />
          <IconsContainer>
            <UpdateSplash
              setShowSplash={setShowAnimation}
              width={250}
              height={250}
            />
          </IconsContainer>
        </Content>
      </Wrapper>
    );
  }

  return (
    <>
      <Routes routes={POPUP_ROUTES} />
      <NavigationBar />
    </>
  );
}

export function WanderBrowserExtensionAppRoot() {
  return (
    <WanderThemeProvider>
      <ErrorBoundary fallback={FallbackView}>
        <WalletsProvider redirectToWelcome>
          <QueryClientProvider client={queryClient}>
            <Wouter hook={useExtensionLocation}>
              <WanderBrowserExtensionApp />
            </Wouter>
          </QueryClientProvider>
        </WalletsProvider>
      </ErrorBoundary>
    </WanderThemeProvider>
  );
}

export default WanderBrowserExtensionAppRoot;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  position: relative;
  width: 100%;
  overflow: hidden;
  background: ${({ theme }) =>
    theme.displayTheme === "dark"
      ? "linear-gradient(180deg, #1e1244 0%, #0d0d0d 100%)"
      : "linear-gradient(180deg, #E3D8F6 0%, #FFF 100%)"};
`;

const Content = styled(Section)`
  position: relative;
  padding: 24;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
`;

const IconsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 22.65px;
`;
