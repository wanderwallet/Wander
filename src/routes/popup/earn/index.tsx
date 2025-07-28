import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useState } from "react";
import { EarnPopup } from "~components/popup/earn/EarnPopup";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import { ArrowUpRight, HelpCircle, LinkExternal01 } from "@untitled-ui/icons-react";
import { Section, Text, Tooltip } from "@arconnect/components-rebrand";
import { Divider } from "~components/Divider";
import { PieChart } from "~components/popup/chart/PieChart";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { AnimatedStarContainer, defaultStars } from "~components/common/AnimatedStarContainer";
import { Link } from "~components/common/Link";
import { EarnTabs } from "~components/popup/earn/EarnTabs";

const stars = defaultStars.toSpliced(1, 1);

export function EarnView() {
  const theme = useTheme();
  const [showEarnPopup, setShowEarnPopup] = useState(false);
  const [showDelegateNotice, setShowDelegateNotice] = useState(false);

  const allocationData = [
    {
      name: browser.i18n.getMessage("primary"),
      value: 100,
      color: "#9787ff",
    },
    {
      name: browser.i18n.getMessage("projects"),
      value: 0,
      color: "#F5CD19",
    },
  ];

  function handleCloseDelegateNotice() {
    ExtensionStorage.set("earn_notice_shown", true);
    setShowDelegateNotice(false);
  }

  useAsyncEffect(async () => {
    const popupShown = (await ExtensionStorage.get<boolean>("earn_popup_shown")) ?? false;
    const delegateShown = (await ExtensionStorage.get<boolean>("earn_notice_shown")) ?? false;
    setShowEarnPopup(!popupShown);
    setShowDelegateNotice(!delegateShown);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("earn")}
        backIcon={<HelpCircle color={theme.secondaryText} width={20} height={20} />}
        back={() => {}}
      />

      <Wrapper>
        <AllocationWrapper>
          <Flex direction="row" gap={12} align="center" justify="space-between">
            <PieChart data={allocationData} width={40} height={40} innerRadius={10} outerRadius={20} />
            <Flex direction="column" gap={4}>
              <Flex direction="row" gap={2} align="center">
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
                    100% {browser.i18n.getMessage("primary")}
                  </Text>
                </Flex>
                <Text variant="secondary" size="xs" weight="medium" noMargin>
                  •
                </Text>
                <Flex direction="row" gap={2}>
                  <AllocationBox color="#F5CD19" />
                  <Text variant="secondary" size="xs" weight="medium" noMargin>
                    0% {browser.i18n.getMessage("projects")}
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

        {showDelegateNotice && (
          <AnimatedStarContainer
            stars={stars}
            padding="14px 12px 16px 12px"
            onClose={handleCloseDelegateNotice}
            showCloseButton>
            <Flex direction="column" gap={8}>
              <Text style={{ fontSize: 15 }} weight="medium" noMargin>
                {browser.i18n.getMessage("earn_notice_title")}
              </Text>
              <Text variant="secondary" size="xs" weight="medium" noMargin>
                {browser.i18n.getMessage("earn_notice_description")}
              </Text>
              <Link
                href="https://www.wander.app/blog/wndr-fair-launch"
                style={{ color: "#9787FF", gap: "4px", fontSize: 14, fontWeight: 600 }}>
                {browser.i18n.getMessage("learn_more")} <ArrowUpRight height={18} width={18} />
              </Link>
            </Flex>
          </AnimatedStarContainer>
        )}

        <EarnTabs />
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
  color: #9787ff;
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
