import { AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { Button, Spacer, Text } from "@arconnect/components-rebrand";
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
  Wrapper,
  Header,
  Image,
  HeaderIconWrapper,
  PageWrapper,
  Page
} from "./setup";
import StarIcons from "~components/welcome/StarIcons";
import { GettingStartedWelcomeView } from "./gettingStarted/welcome";
import { GettingStartedTokensView } from "./gettingStarted/tokens";
import { GettingStartedOnrampView } from "./gettingStarted/onramp";
import { GettingStartedConnectView } from "./gettingStarted/connect";
import { GettingStartedExploreView } from "./gettingStarted/explore";
import { GettingStartedPersonalizeView } from "./gettingStarted/personalize";
import { Link } from "~routes/popup/token/[id]";
import IconText from "~components/IconText";
import WanderIcon from "url:assets/icon.svg";

const Views = [
  GettingStartedWelcomeView,
  GettingStartedTokensView,
  GettingStartedOnrampView,
  GettingStartedExploreView,
  GettingStartedPersonalizeView,
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

  if (isNaN(page) || page < 1 || page > 6) {
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
    } else if (pageNum < 7) {
      navigate(`/getting-started/${pageNum}`);
    } else {
      handleClose();
    }
  };

  const View = Views[page - 1];

  return (
    <Wrapper linearBackground>
      <Header>
        <HeaderIconWrapper>
          <Image
            width="57.61px"
            height="27px"
            src={WanderIcon}
            alt="Wander Icon"
          />
          <IconText width={116.759} height={24.111} />
        </HeaderIconWrapper>
        <Link href="https://www.wander.app/help#browser-extension">
          <Text variant="secondary" size="base" weight="medium" noMargin>
            {browser.i18n.getMessage("need_help")}
          </Text>
        </Link>
      </Header>
      <StarIcons screen="setup" />
      <Spacer y={2} />
      <SetupCard transparentBackground>
        <HeaderContainer>
          <CardHeader>
            {page > 1 && (
              <BackButton onClick={() => navigateToPage(page - 1)} />
            )}
            <Text style={{ fontSize: 22, margin: "auto" }} weight="bold">
              {browser.i18n.getMessage("getting_started")}
            </Text>
          </CardHeader>
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
            {browser.i18n.getMessage(page < 6 ? "next" : "finish")}
          </Button>
        </Footer>
      </SetupCard>
    </Wrapper>
  );
}

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
