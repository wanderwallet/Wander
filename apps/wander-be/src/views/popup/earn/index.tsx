import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useCallback, useMemo, useState } from "react";
import { EarnPopup } from "~components/popup/earn/EarnPopup";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import { HelpCircle, LinkExternal01 } from "@untitled-ui/icons-react";
import { Section, Text, Tooltip, Button } from "@arconnect/components-rebrand";
import { Divider } from "~components/Divider";
import { PieChart } from "~components/popup/chart/PieChart";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { EarnTabs } from "~components/popup/earn/EarnTabs";
import { useAOYieldDelegations, useDelegationPercentByType } from "~utils/fair_launch/fair_launch.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { EarnDelegationNotice } from "~components/popup/earn/EarnDelegationNotice";
import { EarnAOTokensDetectedNotice } from "~components/popup/earn/EarnAOTokensDetectedNotice";
import { EventType, PageType, trackEvent, trackPage } from "~utils/analytics";

export function EarnView() {
  const theme = useTheme();
  const { navigate } = useLocation();
  const [showEarnPopup, setShowEarnPopup] = useState(false);
  const [showAOTokensDetectedNotice, setShowAOTokensDetectedNotice] = useState(false);
  const [showDelegateNotice, setShowDelegateNotice] = useState(false);
  const { primaryPercent = 0, projectsPercent = 0 } = useDelegationPercentByType();
  const { hasNoAOYieldDelegations } = useAOYieldDelegations();

  const allocationData = useMemo(
    () => [
      {
        name: browser.i18n.getMessage("primary"),
        value: primaryPercent,
        color: "#9787ff",
      },
      {
        name: browser.i18n.getMessage("projects"),
        value: projectsPercent,
        color: "#F5CD19",
      },
    ],
    [primaryPercent, projectsPercent],
  );

  const handleCloseDelegateNotice = useCallback(() => {
    ExtensionStorage.set("earn_notice_shown", true);
    setShowDelegateNotice(false);
  }, []);

  const handleCloseAOTokensDetectedNotice = useCallback(() => {
    ExtensionStorage.set("ao_tokens_detected_notice_shown", true);
    setShowAOTokensDetectedNotice(false);
  }, []);

  useAsyncEffect(async () => {
    trackPage(PageType.EARN);

    const [popupShown, delegateShown, aoTokensDetectedShown] = await Promise.all([
      ExtensionStorage.get<boolean>("earn_popup_shown").then((val) => val ?? false),
      ExtensionStorage.get<boolean>("earn_notice_shown").then((val) => val ?? false),
      ExtensionStorage.get<boolean>("ao_tokens_detected_notice_shown").then((val) => val ?? false),
    ]);

    setShowEarnPopup(!popupShown);
    setShowDelegateNotice(!delegateShown);
    setShowAOTokensDetectedNotice(!aoTokensDetectedShown);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("earn")}
        backIcon={<HelpCircle color={theme.secondaryText} width={20} height={20} />}
        back={() => setShowEarnPopup(true)}
      />

      <Wrapper>
        <AllocationWrapper>
          <Flex direction="row" gap={12} align="center" justify="space-between">
            <PieChart data={allocationData} width={40} height={40} innerRadius={10} outerRadius={20} />
            <Flex direction="column" gap={4}>
              <Flex direction="row" gap={4} align="center">
                <Text weight="semibold" noMargin>
                  {browser.i18n.getMessage("allocation")}
                </Text>
                <Tooltip
                  position="bottom"
                  content={
                    <Text size="xs" weight="medium" style={{ maxWidth: 210, textAlign: "center" }} noMargin>
                      {browser.i18n.getMessage("allocation_description")}
                    </Text>
                  }>
                  <HelpCircle color={theme.secondaryText} width={16} height={16} style={{ cursor: "pointer" }} />
                </Tooltip>
              </Flex>
              <Flex direction="row" gap={4} align="center">
                <Flex direction="row" gap={2}>
                  <AllocationBox color="#9787ff" />
                  <Text variant="secondary" size="xs" weight="medium" noMargin>
                    {primaryPercent}% {browser.i18n.getMessage("primary")}
                  </Text>
                </Flex>
                <Text variant="secondary" size="xs" weight="medium" noMargin>
                  •
                </Text>
                <Flex direction="row" gap={2}>
                  <AllocationBox color="#F5CD19" />
                  <Text variant="secondary" size="xs" weight="medium" noMargin>
                    {projectsPercent}% {browser.i18n.getMessage("projects")}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Divider />
          <BreakdownWrapper
            direction="row"
            gap={4}
            align="center"
            onClick={() => {
              browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" });
            }}>
            <BreakdownText>{browser.i18n.getMessage("view_full_breakdown_on_ao_website")}</BreakdownText>
            <LinkExternal01 width={16} height={16} color="#9787ff" />
          </BreakdownWrapper>
        </AllocationWrapper>

        {showDelegateNotice && !hasNoAOYieldDelegations && <EarnDelegationNotice onClose={handleCloseDelegateNotice} />}
        {showAOTokensDetectedNotice && hasNoAOYieldDelegations && (
          <EarnAOTokensDetectedNotice onClose={handleCloseAOTokensDetectedNotice} />
        )}

        <EarnTabs />

        <Button
          variant="secondary"
          onClick={() => {
            trackEvent(EventType.MANAGE_EARNINGS_BUTTON, {});
            navigate(PopupPaths.ManageEarnings);
          }}
          fullWidth>
          {browser.i18n.getMessage("manage_earnings")}
        </Button>
      </Wrapper>
      <EarnPopup isOpen={showEarnPopup} setOpen={setShowEarnPopup} />
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  gap: 24px;
  padding-bottom: 100px;
`;

const AllocationWrapper = styled.div`
  display: flex;
  padding: 16px 12px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.surfaceSecondary};
`;

const BreakdownText = styled(Text).attrs({ size: "sm", weight: "semibold", noMargin: true })`
  color: ${({ theme }) => (theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9")};
`;

const BreakdownWrapper = styled(Flex)`
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const AllocationBox = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 0.75px solid ${({ theme }) => theme.borderDefault};
  background: ${({ color }) => color};
`;
