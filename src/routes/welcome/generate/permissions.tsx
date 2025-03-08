import Paragraph from "~components/Paragraph";
import { useContext, useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import {
  PasswordContext,
  WalletContext,
  type SetupWelcomeViewParams
} from "../setup";
import {
  EventType,
  isUserInGDPRCountry,
  PageType,
  trackEvent,
  trackPage
} from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button, Text, Spacer } from "@arconnect/components-rebrand";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { loadTokens } from "~tokens/token";
import { addWallet } from "~wallets";
import { useHardwareApi } from "~wallets/hooks";

export type PermissionsWelcomeViewProps =
  CommonRouteProps<SetupWelcomeViewParams>;

export function PermissionsWelcomeView({
  params
}: PermissionsWelcomeViewProps) {
  const { navigate } = useLocation();

  const hardwareApi = useHardwareApi();

  const { wallet } = useContext(WalletContext);
  const { password } = useContext(PasswordContext);
  const walletRef = useRef(wallet);

  // loading
  const [loading, setLoading] = useState(false);

  // wallet generation taking longer
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  const [analyticSetting, setAnalyticSetting] = useStorage(
    {
      key: "setting_analytics",
      instance: ExtensionStorage
    },
    (v) => v ?? false
  );

  const [notificationSetting, setNotificationSetting] = useStorage(
    {
      key: "setting_notifications",
      instance: ExtensionStorage
    },
    (v) => v ?? false
  );

  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });

  const [, setShowAnnouncement] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });

  // add generated wallet
  async function done() {
    if (loading) return;

    const startTime = Date.now();

    setLoading(true);
    if (hardwareApi) {
      await loadTokens();

      // log user onboarded
      await trackEvent(EventType.ONBOARDED, {});

      if (!analyticSetting && !answered) {
        await setAnswered(true);
        await setAnalyticSetting(false);
      }

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
          if (!showLongWaitMessage) {
            setShowLongWaitMessage(Date.now() - startTime > 10000);
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

    if (!analyticSetting && !answered) {
      await setAnswered(true);
      await setAnalyticSetting(false);
    }

    // redirect to getting started pages
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);

    setShowLongWaitMessage(false);
    setLoading(false);

    // reset before unload
    window.onbeforeunload = null;
  }

  // determine location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const loc = await isUserInGDPRCountry();
        setAnalyticSetting(!loc);
      } catch (err) {
        console.error(err);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_PERMISSIONS);
  }, []);

  return (
    <Container>
      <Content>
        <Paragraph>
          {browser.i18n.getMessage("enable_permissions_description")}
        </Paragraph>
        <div>
          <BoxContainer>
            <ToggleSwitch
              checked={analyticSetting}
              setChecked={(checked) => {
                setAnalyticSetting(checked);
                setAnswered(true);
              }}
              height={31}
              width={51}
            />
            <div style={{ flex: 1 }}>
              <Text size="md" weight="medium" noMargin>
                {browser.i18n.getMessage("analytics")}
              </Text>
              <Spacer y={0.25} />
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("enable_analytics_description")}
              </Text>
            </div>
          </BoxContainer>
          <Spacer y={1} />
          <BoxContainer>
            <ToggleSwitch
              checked={notificationSetting}
              setChecked={(checked) => {
                setNotificationSetting(checked);
                setShowAnnouncement(false);
              }}
              height={31}
              width={51}
            />
            <div style={{ flex: 1 }}>
              <Text size="md" weight="medium" noMargin>
                {browser.i18n.getMessage("setting_notifications")}
              </Text>
              <Spacer y={0.25} />
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("enable_notifications_description")}
              </Text>
            </div>
          </BoxContainer>
        </div>
      </Content>
      <Button fullWidth onClick={done} loading={loading}>
        {browser.i18n.getMessage("continue")}
      </Button>
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
  gap: 24px;
`;

const BoxContainer = styled.div`
  display: flex;
  padding: 12px;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  border-radius: 8px;
  background: ${(props) => props.theme.input.background.dropdown.default};
`;
