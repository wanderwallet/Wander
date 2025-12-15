import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Button, Text } from "@wanderapp/components";
import alertWarning from "url:/assets/agents/images/alert-warning.svg";
import { useEffect, useState } from "react";
import { useAODelegationInfo } from "~utils/agents/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

export function AODelegationModal() {
  const { navigate } = useLocation();
  const hasAODelegation = useAODelegationInfo();
  const [open, setOpen] = useState(false);

  function handleUpdatePreferences() {
    setOpen(false);
    navigate(PopupPaths.ManageEarnings);
  }

  useEffect(() => {
    if (!hasAODelegation) {
      setOpen(true);
    }
  }, [hasAODelegation]);

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
