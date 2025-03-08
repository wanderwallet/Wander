import { Button, Text } from "@arconnect/components-rebrand";
import { WalletContext, type SetupWelcomeViewParams } from "../setup";
import browser from "webextension-polyfill";
import { useContext, useEffect, useState } from "react";
import { PageType, trackPage } from "~utils/analytics";
import JSConfetti from "js-confetti";
import WalletIconSvg from "url:~assets/setup/wallet.svg";
import styled from "styled-components";
import { CopyToClipboard } from "~components/CopyToClipboard";
import { formatAddress } from "~utils/format";
import Squircle from "~components/Squircle";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useActiveWallet } from "~wallets/hooks";

export type GenerateDoneWelcomeViewProps =
  CommonRouteProps<SetupWelcomeViewParams>;

export function GenerateDoneWelcomeView({
  params
}: GenerateDoneWelcomeViewProps) {
  // wallet context
  const { wallet } = useContext(WalletContext);
  const activeWallet = useActiveWallet();
  const { navigate } = useLocation();
  const { setupMode } = params;

  // add generated wallet
  async function goToDashboard() {
    window.onbeforeunload = null;
    window.top.close();
  }

  async function takeTour() {
    navigate("/getting-started/1");
  }

  useEffect(() => {
    const jsConfetti = new JSConfetti();

    jsConfetti.addConfetti();
  }, []);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_COMPLETE);
  }, []);

  return (
    <Container>
      <Content>
        <WalletIcon />
        <InnerContent>
          <Text size="lg" weight="bold" noMargin>
            {browser.i18n.getMessage("congratulations")}
          </Text>
          <Text variant="secondary" noMargin>
            {browser.i18n.getMessage("congratulations_description", [
              browser.i18n.getMessage(
                setupMode === "generate" ? "creating" : "importing"
              )
            ])}
          </Text>
        </InnerContent>
        <InnerContent>
          <AccountContainer>
            <AccountIcon
              placeholderText={wallet?.nickname?.slice(0, 1) || "A"}
            />
            <Text size="base" weight="medium" noMargin>
              {wallet?.nickname || "Account 1"}
            </Text>
          </AccountContainer>
          <Text size="base" weight="medium" noMargin>
            {browser.i18n.getMessage("your_wallet_address_is")}
          </Text>
          <CopyToClipboard
            label={formatAddress(wallet.address || activeWallet?.address, 16)}
            labelAs={Label}
            text={wallet.address}
          />
        </InnerContent>
      </Content>
      <Actions>
        <Button fullWidth onClick={takeTour}>
          {browser.i18n.getMessage("take_a_tour")}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={goToDashboard}
          style={{ marginTop: "auto" }}
        >
          {browser.i18n.getMessage("go_to_dashboard")}
        </Button>
      </Actions>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 24px;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 24px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
`;

const InnerContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const WalletIcon = styled.img.attrs({
  src: WalletIconSvg
})`
  height: 72px;
  width: 72px;
`;

const AccountContainer = styled.div`
  display: flex;
  padding: 6px 8px;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  background: ${(props) => props.theme.input.background.default.default};
  width: max-content;
`;

const Label = styled(Text).attrs({
  size: "xs",
  weight: "medium",
  noMargin: true
})``;

const AccountIcon = styled(Squircle)`
  width: 24px;
  height: 24px;
  color: ${(props) => props.theme.theme};
`;
