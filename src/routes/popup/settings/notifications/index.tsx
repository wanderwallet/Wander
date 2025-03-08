import { useStorage } from "~utils/storage";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { Spacer, Text, TooltipV2 } from "@arconnect/components";
import browser from "webextension-polyfill";
import { RadioWrapper, RadioItem } from "~components/dashboard/Setting";
import HeadV2 from "~components/popup/HeadV2";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";
import { InformationIcon } from "@iconicicons/react";
import Checkbox from "~components/Checkbox";
import { useLocation } from "~wallets/router/router.utils";

export function NotificationSettingsView() {
  const { navigate } = useLocation();

  const [notificationSettings, setNotificationSettings] = useStorage(
    {
      key: "setting_notifications",
      instance: ExtensionStorage
    },
    false
  );
  const [notificationCustomizeSettings, setNotificationCustomizeSettings] =
    useStorage(
      {
        key: "setting_notifications_customize",
        instance: ExtensionStorage
      },
      ["default"]
    );

  const toggleNotificationSetting = () => {
    setNotificationSettings(!notificationSettings);
  };

  const handleRadioChange = (setting) => {
    setNotificationCustomizeSettings([setting]);
  };

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("setting_notifications")}
        back={() => navigate("/quick-settings")}
      />
      <Wrapper>
        <ToggleSwitchWrapper>
          <TitleWrapper>
            <Title noMargin>
              {browser.i18n.getMessage("toggle_notifications")}
            </Title>
            <TooltipV2
              content={
                <div
                  style={{
                    width: "160px",
                    textAlign: "center",
                    fontSize: "12px"
                  }}
                >
                  {browser.i18n.getMessage("toggle_notifications_decription")}
                </div>
              }
              position="bottom"
            >
              <InfoIcon />
            </TooltipV2>
          </TitleWrapper>
          <ToggleSwitch
            checked={notificationSettings}
            setChecked={toggleNotificationSetting}
          />
        </ToggleSwitchWrapper>
        <Spacer y={1.5} />
        <RadioWrapper style={{ gap: "12px" }}>
          {/* AR AND AO TRANSFER NOTIFICATIONS  */}
          <RadioItem
            style={{ padding: 0 }}
            onClick={() => handleRadioChange("default")}
          >
            <Checkbox
              size={16}
              checked={
                notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("default")
              }
              onChange={(_) => handleRadioChange("default")}
            />
            <RadioText noMargin>
              Enable Arweave and ao Transaction Notifications
            </RadioText>
          </RadioItem>
          {/* JUST AR TRANSFER NOTIFICATIONS  */}
          <RadioItem
            style={{ padding: 0 }}
            onClick={(_) => handleRadioChange("arTransferNotifications")}
          >
            <Checkbox
              size={16}
              checked={
                notificationCustomizeSettings &&
                notificationCustomizeSettings.includes(
                  "arTransferNotifications"
                )
              }
              onChange={(_) => handleRadioChange("arTransferNotifications")}
            />
            <RadioText noMargin>
              Enable Arweave Transaction Notifications
            </RadioText>
          </RadioItem>
          {/* ALL NOTIFICATIONS */}
          <RadioItem
            style={{ padding: 0 }}
            onClick={(_) => handleRadioChange("allTxns")}
          >
            <Checkbox
              size={16}
              checked={
                notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("allTxns")
              }
              onChange={(_) => handleRadioChange("allTxns")}
            />
            <RadioText noMargin>
              Enable all Arweave and ao Notifications
            </RadioText>
          </RadioItem>
        </RadioWrapper>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
`;

const ToggleSwitchWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled(Text)`
  color: ${(props) => props.theme.primaryText};
`;

const TitleWrapper = styled.div`
  display: flex;
  gap: 4px;
`;

const RadioText = styled(Text)`
  font-size: 0.75rem;
  color: ${(props) => props.theme.primaryText};
`;

const InfoIcon = styled(InformationIcon)`
  color: ${(props) => props.theme.secondaryTextv2};
`;
