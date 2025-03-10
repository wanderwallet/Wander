import { Text, Input } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";
import { useStorage } from "~utils/storage";
import { useState, useEffect } from "react";

export const SignSettingsDashboardView = () => {
  const [transferRequirePassword, setTransferRequirePassword] = useStorage(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage
    },
    false
  );

  const [connectRequirePassword, setConnectRequirePassword] = useStorage(
    {
      key: "connect_require_password",
      instance: ExtensionStorage
    },
    false
  );

  const [autoSignOut, setAutoSignOut] = useStorage(
    {
      key: "auto_sign_out_enabled",
      instance: ExtensionStorage
    },
    false
  );

  const [autoSignOutTime, setAutoSignOutTime] = useStorage(
    {
      key: "auto_sign_out_time",
      instance: ExtensionStorage
    },
    5
  );

  const [timeInput, setTimeInput] = useState(autoSignOutTime.toString());

  useEffect(() => {
    setTimeInput(autoSignOutTime.toString());
  }, [autoSignOutTime]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setTimeInput(value);
  };

  const handleTimeBlur = () => {
    const time = parseInt(timeInput, 10);
    if (!isNaN(time) && time > 0) {
      setAutoSignOutTime(time);
    } else {
      setTimeInput(autoSignOutTime.toString());
    }
  };

  return (
    <Wrapper>
      <ToggleSwitchWrapper>
        <Text noMargin>
          {browser.i18n.getMessage("enable_transfer_settings")}
        </Text>
        <ToggleSwitch
          width={51}
          height={31}
          checked={transferRequirePassword}
          setChecked={setTransferRequirePassword}
        />
      </ToggleSwitchWrapper>
      <ToggleSwitchWrapper>
        <Text noMargin>
          {browser.i18n.getMessage("enable_connect_settings")}
        </Text>
        <ToggleSwitch
          width={51}
          height={31}
          checked={connectRequirePassword}
          setChecked={setConnectRequirePassword}
        />
      </ToggleSwitchWrapper>
      <ToggleSwitchWrapper>
        <Text noMargin>
          {browser.i18n.getMessage("auto_sign_out_settings")}
        </Text>
        <ToggleSwitch
          width={51}
          height={31}
          checked={autoSignOut}
          setChecked={setAutoSignOut}
        />
      </ToggleSwitchWrapper>
      {autoSignOut && (
        <TimeInputWrapper>
          <Input
            type="number"
            value={timeInput}
            onChange={handleTimeChange}
            onBlur={handleTimeBlur}
            placeholder="15"
            fullWidth
          />
          <Text noMargin style={{ marginLeft: "8px" }}>
            {browser.i18n.getMessage("minutes")}
          </Text>
        </TimeInputWrapper>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ToggleSwitchWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TimeInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: row;
  align-items: center;
  margin-top: -12px;
`;
