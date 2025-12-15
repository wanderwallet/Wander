import { Text } from "@wanderapp/components";
import { ExtensionStorage } from "~utils/storage";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import browser from "webextension-polyfill";
import styled from "styled-components";

import swapAnnouncementBackground from "~assets/images/swap/swap_announcement_bg.png";

export const SwapAnnouncementPopup = ({ isOpen, setOpen }) => {
  async function handleClose() {
    setOpen(false);
    await ExtensionStorage.set("swap_announcement_shown", true);
  }

  return (
    <SliderMenu
      isOpen={isOpen}
      onClose={handleClose}
      paddingVertical={32}
      paddingHorizontal={24}
      style={{
        backgroundImage: `url(${swapAnnouncementBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center top 32px",
        backgroundRepeat: "no-repeat",
        boxSizing: "border-box",
        backgroundColor: "#121212",
      }}
      closeIconColor="white"
      fullscreen>
      <Flex direction="column" justify="space-between" align="center" height="100%" width="100%" gap={32}>
        <Title>{browser.i18n.getMessage("swap_announcement_title")}</Title>
      </Flex>
    </SliderMenu>
  );
};

const Title = styled(Text).attrs({
  size: "3xl",
  weight: "bold",
  noMargin: true,
})`
  text-align: center;
  font-family: Satoshi, sans-serif;
  line-height: 120%;
  background: linear-gradient(0deg, #6b57f9 0%, #9787ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
