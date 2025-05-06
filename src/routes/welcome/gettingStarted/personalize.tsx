import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { Container, Content } from "~components/welcome/Wrapper";
import { Checkbox, Input, Text, useInput, useToasts } from "@arconnect/components-rebrand";
import { useStorage, ExtensionStorage } from "~utils/storage";
import type { StoredWallet } from "~wallets";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { Divider } from "~components/Divider";
import useSetting from "~settings/hook";
import { useActiveWallet } from "~wallets/hooks";
import { useSearchParams } from "~wallets/router/router.utils";

const themes = ["system", "light", "dark"] as const;

export function GettingStartedPersonalizeView() {
  const { setToast } = useToasts();
  const { isPopup } = useSearchParams() as { isPopup: string };
  const [theme, setTheme] = useSetting("display_theme");
  const activeWallet = useActiveWallet();
  const [_, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage,
    },
    [],
  );

  // wallet name input
  const walletNameInput = useInput(activeWallet?.nickname);

  // update nickname function
  async function updateNickname() {
    const newName = walletNameInput.state;

    if (!newName || newName === "") {
      return setToast({
        type: "error",
        content: "Please enter a valid nickname",
        duration: 2200,
      });
    }

    // update wallets
    try {
      await setWallets((val) =>
        val.map((wallet) => {
          if (wallet.address !== activeWallet?.address) {
            return wallet;
          }

          return {
            ...wallet,
            nickname: newName,
          };
        }),
      );

      setToast({
        type: "info",
        content: browser.i18n.getMessage("updated_wallet_name"),
        duration: 3000,
      });
    } catch (e) {
      console.log("Could not update nickname", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_updating_wallet_name"),
        duration: 3000,
      });
    }
  }

  useEffect(() => {
    if (!activeWallet) return;
    walletNameInput.setState(activeWallet?.nickname);
  }, [activeWallet]);

  // Segment
  useEffect(() => {
    trackPage(PageType.GETTING_STARTED_PERSONALIZE);
  }, []);

  return (
    <Container>
      <Content justifyContent="flex-start" alignItems="center" textAlign="center">
        <Text size={isPopup ? "lg" : "xl"} weight="bold" noMargin>
          {browser.i18n.getMessage("personalize_your_experience")}
        </Text>
        <Flex direction="column" gap={8} width="100%" align="start">
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("name_your_account")}
          </Text>
          <Input
            type="text"
            {...walletNameInput.bindings}
            placeholder={"Account 1"}
            fullWidth
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              updateNickname();
            }}
            onBlur={updateNickname}
          />
          <Text variant="secondary" size="2xs" weight="medium" noMargin>
            {browser.i18n.getMessage("account_name_save_description")}
          </Text>
        </Flex>
        <Divider />
        <Flex direction="column" gap={16} width="100%" align="start">
          <Text weight="medium" noMargin>
            {browser.i18n.getMessage("choose_ui_theme_description")}
          </Text>
          {themes.map((t) => (
            <Checkbox
              key={t}
              checked={theme === t}
              onChange={() => setTheme(t)}
              label={browser.i18n.getMessage(t + "_theme")}
            />
          ))}
        </Flex>
      </Content>
    </Container>
  );
}
