import { AnimatePresence, type Variants, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Button, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";

import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Redirect } from "~wallets/router/components/redirect/Redirect";
import {
  SetupCard,
  HeaderContainer,
  Content,
  CardHeader,
  BackButton,
  Wrapper
} from "./setup";
import StarIcons from "~components/welcome/StarIcons";
import { GettingStartedWelcomeView } from "./gettingStarted/welcome";
import { GettingStartedTokensView } from "./gettingStarted/tokens";
import { GettingStartedOnrampView } from "./gettingStarted/onramp";
import { GettingStartedConnectView } from "./gettingStarted/connect";
import { GettingStartedExploreView } from "./gettingStarted/explore";

const Views = [
  GettingStartedWelcomeView,
  GettingStartedTokensView,
  GettingStartedOnrampView,
  GettingStartedExploreView,
  GettingStartedConnectView
];

export interface GettingStartedSetupWelcomeViewParams {
  // TODO: Use a nested router instead:
  page: string;
}

export type GettingStartedSetupWelcomeViewProps =
  CommonRouteProps<GettingStartedSetupWelcomeViewParams>;

export function GettingStartedSetupWelcomeView({
  params: { page: pageParam }
}: GettingStartedSetupWelcomeViewProps) {
  const { navigate } = useLocation();
  const page = Number(pageParam);

  // animate content size
  const [contentSize, setContentSize] = useState<number>(0);
  const contentRef = useCallback<(el: HTMLDivElement) => void>((el) => {
    if (!el) return;

    const obs = new ResizeObserver(() => {
      if (!el || el.clientHeight <= 0) return;
      setContentSize(el.clientHeight);
    });

    obs.observe(el);
  }, []);

  if (isNaN(page) || page < 1 || page > 5) {
    return <Redirect to="/getting-started/1" />;
  }

  const handleClose = () => {
    // reset before unload
    window.onbeforeunload = null;
    window.top.close();
  };

  const navigateToPage = (pageNum: number) => {
    if (pageNum < 1) {
      navigate("/getting-started/1");
    } else if (pageNum < 6) {
      navigate(`/getting-started/${pageNum}`);
    } else {
      handleClose();
    }
  };

  const View = Views[page - 1];

  return (
    <Wrapper linearBackground>
      <SetupCard transparentBackground>
        <HeaderContainer>
          {page > 1 && (
            <CardHeader>
              <BackButton onClick={() => navigateToPage(page - 1)} />
              <Text style={{ fontSize: 22, margin: "auto" }} weight="bold">
                {browser.i18n.getMessage("getting_started")}
              </Text>
            </CardHeader>
          )}
        </HeaderContainer>
        <Content>
          <PageWrapper style={{ height: contentSize }}>
            <AnimatePresence initial={false}>
              <Page key={page} ref={contentRef}>
                <View />
              </Page>
            </AnimatePresence>
          </PageWrapper>
        </Content>
        <Footer>
          <Button fullWidth onClick={() => navigateToPage(page + 1)}>
            {browser.i18n.getMessage(page < 5 ? "next" : "finish")}
          </Button>
          {page < 5 && (
            <Button variant="secondary" fullWidth onClick={handleClose}>
              {browser.i18n.getMessage("close")}
            </Button>
          )}
        </Footer>
      </SetupCard>
      <StarIcons screen="setup" />
    </Wrapper>
  );
}

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Page = styled(motion.div).attrs({
  variants: pageAnimation,
  initial: "exit",
  animate: "init"
})`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  transition: height 0.17s ease;
`;
