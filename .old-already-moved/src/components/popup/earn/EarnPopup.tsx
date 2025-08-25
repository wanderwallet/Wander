import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Text, Button } from "@arconnect/components-rebrand";
import earnPopupImage from "~assets/images/earn/earn-popup.svg";
import { StarIcon } from "../tier/StarIcon";
import browser from "webextension-polyfill";
import { ExtensionStorage } from "~utils/storage";

const earnTokensList = [
  browser.i18n.getMessage("earn_tokens_list_item_1"),
  browser.i18n.getMessage("earn_tokens_list_item_2"),
  browser.i18n.getMessage("earn_tokens_list_item_3"),
];

export const EarnPopup = ({ isOpen, setOpen }) => {
  function handleClose() {
    setOpen(false);
    ExtensionStorage.set("earn_popup_shown", true);
  }

  function handleLearnMore() {
    browser.tabs.create({ url: "https://www.wander.app/blog/wndr-fair-launch" });
    handleClose();
  }

  return (
    <SliderMenu isOpen={isOpen} onClose={handleClose} paddingVertical={32}>
      <Flex direction="column">
        <img src={earnPopupImage} alt="Earn Popup" width="100%" style={{ marginTop: -12, marginBottom: -8 }} />
        <Flex direction="column" gap={24}>
          <Flex direction="column" gap={8} justify="center" align="center">
            <Text size="md" weight="semibold" noMargin>
              {browser.i18n.getMessage("earn_tokens_in_wander")}
            </Text>
            <Text variant="secondary" weight="medium" noMargin>
              {browser.i18n.getMessage("earn_tokens_in_wander_description")}
            </Text>
          </Flex>
          <Flex direction="column" gap={8}>
            {earnTokensList.map((item, index) => (
              <Flex direction="row" gap={8} key={`earn-data-${index}`}>
                <StarIcon color="#6B57F9" />
                <Text weight="medium" noMargin>
                  {item}
                </Text>
              </Flex>
            ))}
          </Flex>
          <Flex direction="column" gap={12}>
            <Button fullWidth onClick={handleClose}>
              {browser.i18n.getMessage("got_it")}
            </Button>
            <Button variant="secondary" fullWidth onClick={handleLearnMore}>
              {browser.i18n.getMessage("learn_more")}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </SliderMenu>
  );
};
