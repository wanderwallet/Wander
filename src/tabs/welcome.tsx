import { useHashLocation } from "wouter/use-hash-location";
import { Router as Wouter } from "wouter";

import { WanderThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useRemoveCover } from "~wallets/setup/non/non-wallet-setup.hook";
import { BodyScroller } from "~wallets/router/router.utils";
import { AnimatePresence } from "framer-motion";
import { Routes } from "~wallets/router/routes.component";
import { WELCOME_ROUTES } from "~wallets/router/welcome/welcome.routes";
import { ErrorBoundary } from "~utils/error/ErrorBoundary/errorBoundary";
import { FallbackView } from "~components/page/common/Fallback/fallback.view";

export function WanderWelcomeApp() {
  return <Routes routes={WELCOME_ROUTES} pageComponent={null} />;
}

export function WanderWelcomeAppRoot() {
  useRemoveCover();

  return (
    <WanderThemeProvider>
      <ErrorBoundary fallback={FallbackView}>
        <Wouter hook={useHashLocation}>
          <BodyScroller />
          <AnimatePresence initial={false}>
            <WanderWelcomeApp />
          </AnimatePresence>
        </Wouter>
      </ErrorBoundary>
    </WanderThemeProvider>
  );
}

export default WanderWelcomeAppRoot;
