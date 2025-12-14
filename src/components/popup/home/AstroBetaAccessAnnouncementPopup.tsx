import { Button, Text, ARCONNECT_DARK_THEME } from "@wanderapp/components";
import { ExtensionStorage } from "~utils/storage";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import styled from "styled-components";
import astroBetaAnnouncementBackground from "~assets/images/astro-beta-announcement/astro_beta_announcement_bg.png";
import wanderLogo from "~assets/icon.svg";
import astroLogo from "~assets/images/astro-beta-announcement/astro_logo.png";
import { CloseIcon } from "@iconicicons/react";
import { TierTag } from "../tier/TierTag";
import { TierTypes } from "~utils/tier/constants";
import browser from "webextension-polyfill";

const tiers = [TierTypes.Reserve, TierTypes.Edge, TierTypes.Prime];

export const AstroBetaAccessAnnouncementPopup = ({ isOpen, setOpen }) => {
  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("astro_beta_access_announcement_shown", true);
  }

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={handleClose}
      paddingVertical={32}
      paddingHorizontal={24}
      style={{
        backgroundImage: `url(${astroBetaAnnouncementBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        boxSizing: "border-box",
      }}
      closeIconColor="white"
      fullscreen>
      <Flex direction="column" justify="space-between" align="center" height="100%" width="100%">
        <Flex direction="column" gap={16} align="center" justify="center" height="100%">
          <Flex direction="column" gap={8} align="center" justify="center">
            <Text
              size="sm"
              weight="medium"
              style={{
                fontFamily: "Satoshi, sans-serif",
                fontWeight: "500",
                lineHeight: "140%",
                letterSpacing: "0.2px",
                color: "#EEE",
              }}
              noMargin>
              {browser.i18n.getMessage("wndr_member_benefits")}
            </Text>
            <Title>
              <span>USDA</span> {browser.i18n.getMessage("beta_access")}
            </Title>
          </Flex>
          <Flex direction="row" gap={18} align="center" justify="center">
            <Flex direction="column" gap={4} align="center" justify="center">
              <Ticker>$WNDR</Ticker>
              <Flex direction="row" gap={4} align="center" justify="center">
                <img width={26.994} height={12.651} src={wanderLogo} alt="wander" />
                <Text size="sm" style={{ color: "#fff" }} noMargin>
                  Wander
                </Text>
              </Flex>
            </Flex>
            <CloseIcon color="#FFF" />
            <Flex direction="column" gap={4} align="center" justify="center">
              <Ticker>$USDA</Ticker>
              <Flex direction="row" gap={4} align="center" justify="center">
                <img src={astroLogo} alt="astro" />
              </Flex>
            </Flex>
          </Flex>
          <Flex direction="column" gap={20} align="center" justify="center" flex={1} height="100%">
            <Flex direction="column" gap={12} align="center" justify="center">
              {tiers.map((tier) => (
                <TierTag
                  key={`${tier}-tag`}
                  tier={tier}
                  iconHeight={12.932}
                  iconWidth={27.591}
                  textSize="22px"
                  gap={11}
                  boxShadowType="active"
                  theme={ARCONNECT_DARK_THEME}
                />
              ))}
            </Flex>
            <InstantAccessText>{browser.i18n.getMessage("members_instant_access")}</InstantAccessText>
          </Flex>
        </Flex>
        <Button fullWidth onClick={() => browser.tabs.create({ url: "http://bridge.astrousd.com/" })}>
          {browser.i18n.getMessage("get_access")}
        </Button>
      </Flex>
    </SliderMenu>
  );
};

const Title = styled(Text).attrs({
  size: "3xl",
  weight: "bold",
  noMargin: true,
})`
  color: #fff;
  font-family: Satoshi, sans-serif;
  font-weight: 700;

  span {
    color: #4ff37f;
  }
`;

const Ticker = styled(Text).attrs({
  variant: "secondary",
  size: "2xs",
  weight: "medium",
  noMargin: true,
})`
  font-family: Satoshi, sans-serif;
  font-weight: 500;
  color: #c4c4c4;
`;

const InstantAccessText = styled.span`
  text-align: center;
  font-family: Satoshi, sans-serif;
  font-size: 24px;
  font-style: normal;
  font-weight: 700;
  line-height: 130%; /* 31.2px */
  letter-spacing: 0.375px;
  background: linear-gradient(90deg, #a8e5ff 0%, #96fca0 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  width: 183.306px;
`;
