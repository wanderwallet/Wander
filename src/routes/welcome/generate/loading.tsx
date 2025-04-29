import { useContext, useEffect, useRef } from "react";
import browser from "webextension-polyfill";
import {
  PasswordContext,
  WalletContext,
  type SetupWelcomeViewParams
} from "../setup";
import { EventType, trackEvent } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { Text } from "@arconnect/components-rebrand";
import { addWallet } from "~wallets";
import { useHardwareApi } from "~wallets/hooks";
import { loadTokens } from "~tokens/token";
import { WanderLoading } from "../WanderLoading";

export type LoadingWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function LoadingWelcomeView({ params }: LoadingWelcomeViewProps) {
  const { navigate } = useLocation();
  const hardwareApi = useHardwareApi();

  const { wallet } = useContext(WalletContext);
  const { password } = useContext(PasswordContext);
  const walletRef = useRef(wallet);

  // add generated wallet
  async function handleAddWallet() {
    if (hardwareApi) {
      await loadTokens();

      // log user onboarded
      await trackEvent(EventType.ONBOARDED, {});

      // redirect to getting started pages
      navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
    }

    // add wallet
    if (!walletRef.current.address || !walletRef.current.jwk) {
      await new Promise((resolve) => {
        const checkState = setInterval(() => {
          if (walletRef.current.jwk) {
            clearInterval(checkState);
            resolve(null);
          }
        }, 1000);
      });
    }

    // add the wallet
    await addWallet(
      {
        nickname: walletRef.current?.nickname || "Account 1",
        wallet: walletRef.current.jwk
      },
      password
    );

    // load tokens
    await loadTokens();

    // log user onboarded
    await trackEvent(EventType.ONBOARDED, {});

    // redirect to getting started pages
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);

    // reset before unload
    window.onbeforeunload = null;
  }

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  useEffect(() => {
    const timeout = setTimeout(() => handleAddWallet(), 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Container>
      <Content>
        <WanderLoading />
        <Flex direction="column" gap={8} width="100%" align="center">
          <Text style={{ fontSize: "22px" }} weight="bold" noMargin>
            {browser.i18n.getMessage("generating_your_account")}
          </Text>
          <Text weight="medium" variant="secondary" noMargin>
            {browser.i18n.getMessage("generating_your_account_description")}
          </Text>
        </Flex>
      </Content>
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
  justify-content: center;
  align-items: center;
  gap: 24px;
`;
