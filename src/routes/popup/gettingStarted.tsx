import { AnimatePresence } from "framer-motion";
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
  Wrapper,
  PageWrapper,
  Page
} from "../welcome/setup";
import { GettingStartedTokensView } from "../welcome/gettingStarted/tokens";
import { GettingStartedOnrampView } from "../welcome/gettingStarted/onramp";
import { GettingStartedConnectView } from "../welcome/gettingStarted/connect";
import { GettingStartedExploreView } from "../welcome/gettingStarted/explore";
import { GettingStartedPersonalizeView } from "../welcome/gettingStarted/personalize";
import { GettingStartedPinView } from "../welcome/gettingStarted/pin";

const Views = [
  GettingStartedTokensView,
  GettingStartedOnrampView,
  GettingStartedExploreView,
  GettingStartedPersonalizeView,
  GettingStartedPinView,
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

  if (isNaN(page) || page < 1 || page > 6) {
    return <Redirect to="/getting-started/1" />;
  }

  const navigateToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum < 7) {
      navigate(`/getting-started/${pageNum}?isPopup=true`);
    } else {
      navigate("/");
    }
  };

  const View = Views[page - 1];

  return (
    <Wrapper style={{ maxHeight: "100vh", boxSizing: "border-box" }}>
      <SetupCard
        style={{ gap: 0, padding: 0, margin: 0 }}
        transparentBackground
      >
        <HeaderContainer style={{ padding: 24 }}>
          <CardHeader>
            <BackButton onClick={() => navigateToPage(page - 1)} />
            <Text style={{ fontSize: 22, margin: "auto" }} weight="bold">
              {browser.i18n.getMessage("getting_started")}
            </Text>
          </CardHeader>
        </HeaderContainer>
        <Content style={{ padding: 24, paddingTop: 0 }}>
          <PageWrapper>
            <AnimatePresence initial={false}>
              <Page key={page}>
                <View />
              </Page>
            </AnimatePresence>
          </PageWrapper>
          <Footer>
            <Button fullWidth onClick={() => navigateToPage(page + 1)}>
              {browser.i18n.getMessage(page < 6 ? "next" : "finish")}
            </Button>
            {page < 6 && (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigateToPage(page - 1)}
              >
                {browser.i18n.getMessage("close")}
              </Button>
            )}
          </Footer>
        </Content>
      </SetupCard>
    </Wrapper>
  );
}

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
