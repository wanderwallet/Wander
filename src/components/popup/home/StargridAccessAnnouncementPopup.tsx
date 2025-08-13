import { Button, Text, ARCONNECT_DARK_THEME } from "@arconnect/components-rebrand";
import { ExtensionStorage } from "~utils/storage";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import styled from "styled-components";
import { CloseIcon } from "@iconicicons/react";
import { TierTag } from "../tier/TierTag";
import { TierTypes } from "~utils/tier/constants";
import browser from "webextension-polyfill";

import wanderLogo from "~assets/icon.svg";
import stargridAnnouncementBackground from "~assets/images/stargrid-announcement/stargrid_announcement_bg.png";
import stargridLogo from "~assets/images/stargrid-announcement/stargrid_logo.svg";
import samuraiImage from "~assets/images/stargrid-announcement/samurai.png";
import spaceEmperorTrompImage from "~assets/images/stargrid-announcement/space_emperor_tromp.png";

const tiers = [TierTypes.Core, TierTypes.Select];

export const StargridAccessAnnouncementPopup = ({ isOpen, setOpen }) => {
  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("stargrid_announcement_shown", true);
  }

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={handleClose}
      paddingVertical={32}
      paddingHorizontal={24}
      style={{
        backgroundImage: `url(${stargridAnnouncementBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        boxSizing: "border-box",
      }}
      closeIconColor="white"
      fullscreen>
      <Flex direction="column" justify="space-between" align="center" height="100%" width="100%" position="relative">
        <Flex direction="column" gap={16} align="center" justify="center" height="100%" paddingBottom={12} width="100%">
          <Flex direction="column" gap={8} align="center" justify="center">
            <Text
              size="sm"
              weight="medium"
              style={{
                fontFamily: "Satoshi, sans-serif",
                fontWeight: "500",
                lineHeight: "140%",
                letterSpacing: "0.2px",
                color: "#AAA",
              }}
              noMargin>
              {browser.i18n.getMessage("wndr_member_benefits")}
            </Text>
            <Flex direction="column" gap={8} align="center" justify="center">
              <Title>{browser.i18n.getMessage("stargrid_battle_pass")}</Title>
              <ClaimNowWrapper>
                <ClaimNowText>{browser.i18n.getMessage("stargrid_claim_now")}</ClaimNowText>
              </ClaimNowWrapper>
            </Flex>
          </Flex>
          <Flex direction="column" gap={20} align="center" justify="center" flex={1} height="100%">
            <Flex direction="column" gap={32} align="center" justify="center" paddingTop={32}>
              {tiers.map((tier) => (
                <Flex direction="column" gap={8} align="center" justify="center">
                  <TierTag
                    key={`${tier}-tag`}
                    tier={tier}
                    iconHeight={10.6}
                    iconWidth={22.7}
                    textSize="18px"
                    gap={9}
                    boxShadowType="active"
                    theme={ARCONNECT_DARK_THEME}
                  />
                  <DaysText>
                    {tier === TierTypes.Core ? 7 : 30} {browser.i18n.getMessage("days")}
                  </DaysText>
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Flex direction="row" align="center" justify="space-between" position="relative" margin="0 auto" width="100%">
            <Flex direction="column" gap={9.41} align="center" justify="center" paddingTop={16} paddingLeft={16}>
              <img width={37.8} height={17.7} src={wanderLogo} alt="wander" />
              <Text size="md" weight="medium" style={{ color: "#fff" }} noMargin>
                Wander
              </Text>
            </Flex>

            <CloseIcon
              color="#EEEEEE"
              height={32}
              width={32}
              style={{ position: "absolute", left: "40%", top: "45%" }}
            />

            <Flex direction="row" gap={4} align="center" justify="center">
              <img src={stargridLogo} alt="stargrid" />
            </Flex>
          </Flex>
        </Flex>
        <Button fullWidth onClick={() => browser.tabs.create({ url: "https://stargrid.ar.io" })}>
          {browser.i18n.getMessage("get_access")}
        </Button>
      </Flex>
      <AvatarImage src={spaceEmperorTrompImage} showLeft alt="space-emperor-tromp" />
      <AvatarImage src={samuraiImage} alt="samurai" />
    </SliderMenu>
  );
};

const Title = styled(Text).attrs({
  size: "xl",
  weight: "bold",
  noMargin: true,
})`
  color: #ffefdb;
  font-family: Satoshi, sans-serif;
  line-height: 130%;
  letter-spacing: 0.1px;
  text-align: center;
`;

const ClaimNowText = styled(Text).attrs({
  weight: "bold",
  noMargin: true,
})`
  color: #ff8a00;
  text-align: center;
  -webkit-text-stroke-width: 0.68px;
  -webkit-text-stroke-color: #000908;
  font-family: "Tomorrow", sans-serif !important;
  font-size: 16.333px;
  font-style: italic;
  font-weight: 700;
  line-height: 120%;
`;

const ClaimNowWrapper = styled.div`
  width: 241px;
  height: 29px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(90deg, rgba(0, 9, 8, 0) 0%, #000908 51%, rgba(0, 9, 8, 0) 100%);
  clip-path: polygon(
    0 0.339844px,
    4.59595px 0.339844px,
    0.718994px 29.0352px,
    236.475px 29.0352px,
    240.352px 0.339844px
  );

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0.680527px;
    background: linear-gradient(90deg, rgba(255, 138, 0, 0) 0%, #ff8a00 50%, rgba(255, 138, 0, 0) 100%);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 0.680527px;
    background: linear-gradient(90deg, rgba(255, 138, 0, 0) 0%, #ff8a00 50%, rgba(255, 138, 0, 0) 100%);
  }
`;

const DaysText = styled(Text).attrs({
  size: "md",
  weight: "medium",
  noMargin: true,
})`
  color: #fee9ce;
  text-align: center;
  font-family: "Tomorrow", sans-serif !important;
  font-style: normal;
  font-weight: 500;
  line-height: 130%;
  letter-spacing: 0.726px;
`;

const AvatarImage = styled.img<{ showLeft?: boolean }>`
  position: absolute;
  top: 48%;
  transform: translateY(-50%);
  ${({ showLeft }) => (showLeft ? "left: -24px;" : "right: -24px;")}
  width: 160px;
  height: 240px;
  flex-shrink: 0;
  aspect-ratio: 1/1;
`;
