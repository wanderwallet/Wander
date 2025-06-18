import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Button, Text } from "@arconnect/components-rebrand";
import alertWarning from "url:/assets/agents/images/alert-warning.svg";
import { useEffect, useState } from "react";
import { useAODelegationInfo } from "~utils/agents/hooks";

export function AODelegationModal() {
  const { data: aoDelegationInfo } = useAODelegationInfo();
  const [open, setOpen] = useState(false);

  function handleUpdatePreferences() {
    setOpen(false);
    browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" });
  }

  useEffect(() => {
    if (aoDelegationInfo && !aoDelegationInfo.hasAODelegation) {
      setOpen(true);
    }
  }, [aoDelegationInfo]);

  return (
    <SliderMenu isOpen={open} onClose={() => setOpen(false)} paddingVertical={32}>
      <Flex direction="column" gap={32} height="100%" width="100%">
        <Flex direction="column" gap={8}>
          <img src={alertWarning} style={{ margin: "0 auto" }} />
          <Text size="lg" weight="semibold" style={{ fontSize: 22, textAlign: "center" }} noMargin>
            {browser.i18n.getMessage(`ao_delegation_title`)}
          </Text>
          <Text variant="secondary" weight="medium" style={{ textAlign: "center" }} noMargin>
            {browser.i18n.getMessage(`ao_delegation_description`)}
          </Text>
        </Flex>

        <Button onClick={handleUpdatePreferences} fullWidth>
          {browser.i18n.getMessage("update_preferences")}
        </Button>
      </Flex>
    </SliderMenu>
  );
}
