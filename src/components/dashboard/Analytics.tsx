import { Spacer, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";
import { Share03 } from "@untitled-ui/icons-react";
import { Flex } from "~components/common/Flex";

export const AnalyticsSettingsDashboardView = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useStorage(
    {
      key: "setting_analytics",
      instance: ExtensionStorage
    },
    false
  );

  return (
    <Wrapper>
      <ToggleSwitchWrapper>
        <Text size="md" weight="medium" noMargin>
          {browser.i18n.getMessage("enable_disable")}
        </Text>
        <ToggleSwitch
          width={51}
          height={31}
          checked={analyticsEnabled}
          setChecked={setAnalyticsEnabled}
        />
      </ToggleSwitchWrapper>
      <Spacer y={1.5} />
      <Flex
        justify="space-between"
        align="center"
        cursor="pointer"
        onClick={() =>
          browser.tabs.create({ url: "https://www.wander.app/privacy" })
        }
      >
        <Text size="md" weight="medium" noMargin>
          {browser.i18n.getMessage("privacy_policy")}
        </Text>
        <ShareIcon />
      </Flex>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const ToggleSwitchWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
`;

const ShareIcon = styled(Share03)`
  height: 24px;
  width: 24px;
  color: ${({ theme }) => theme.tertiaryText};
`;
