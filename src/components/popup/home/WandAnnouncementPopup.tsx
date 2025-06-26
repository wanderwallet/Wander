import { Button, Text } from "@arconnect/components-rebrand";
import { ExtensionStorage } from "~utils/storage";
import { ContentWrapper } from "~components/modals/Components";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import styled from "styled-components";
import { Percent01, Power01, Star01 } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import wandAnnouncementBackground from "~assets/images/wand_announcement.png";

const features = [
  {
    icon: <Percent01 height={16} width={16} />,
    title: "Up to 100% fee reduction",
  },
  {
    icon: <Star01 height={16} width={16} />,
    title: "Early access to new features",
  },
  {
    icon: <Power01 height={16} width={16} />,
    title: "Access to partner power ups",
  },
] as const;

export const WandAnnouncementPopup = ({ isOpen, setOpen }) => {
  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("wand_announcement_shown", true);
  }

  return (
    <SliderMenu isOpen={isOpen} onClose={handleClose} fullscreen>
      <BackgroundWrapper>
        <ContentWrapper style={{ gap: 24 }}>
          <Flex flex={1}></Flex>
          <Flex direction="column" gap={24} width="100%" align="center">
            <Text size="lg" weight="bold" noMargin>
              Introducing the WAND token!
            </Text>
            <FeaturesBox>
              {features.map((feature) => (
                <Flex direction="row" gap={8} width="100%" align="center">
                  <IconWrapper>{feature.icon}</IconWrapper>
                  <Text weight="semibold" noMargin style={{ whiteSpace: "nowrap" }}>
                    {feature.title}
                  </Text>
                </Flex>
              ))}
            </FeaturesBox>
          </Flex>
          <Flex direction="column" gap={16} width="100%">
            <Button
              fullWidth
              onClick={() => {
                browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" });
              }}>
              Get WAND tokens
            </Button>
            <Button variant="secondary" fullWidth onClick={() => {}}>
              Explore tier benefits
            </Button>
          </Flex>
        </ContentWrapper>
      </BackgroundWrapper>
    </SliderMenu>
  );
};

const BackgroundWrapper = styled.div`
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-image: url("${wandAnnouncementBackground}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 24px;
  box-sizing: border-box;
`;

const FeaturesBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 32px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.theme};
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  background-color: #342888;
  border-radius: 50%;
  padding: 4px;
  box-sizing: border-box;
`;
