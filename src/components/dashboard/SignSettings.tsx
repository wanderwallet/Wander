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

  const [autoLock, setAutoLock] = useStorage(
    {
      key: "auto_lock",
      instance: ExtensionStorage
    },
    {
      enabled: false,
      timeout: 5
    }
  );

  const [timeInput, setTimeInput] = useState(autoLock.timeout.toString());

  useEffect(() => {
    setTimeInput(autoLock.timeout.toString());
  }, [autoLock.timeout]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setTimeInput(value);
  };

  const handleTimeBlur = () => {
    const time = parseInt(timeInput, 10);
    if (!isNaN(time) && time > 0) {
      setAutoLock((prev) => ({ ...prev, timeout: time }));
    } else {
      setTimeInput(autoLock.timeout.toString());
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
          checked={autoLock.enabled}
          setChecked={(value: boolean) =>
            setAutoLock((prev) => ({ ...prev, enabled: value }))
          }
        />
      </ToggleSwitchWrapper>
      {autoLock.enabled && (
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
