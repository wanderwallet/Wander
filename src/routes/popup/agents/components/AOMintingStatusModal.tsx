import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Button, Text } from "@arconnect/components-rebrand";
import alertWarning from "url:/assets/agents/images/alert-warning.svg";
import alertSuccess from "url:/assets/agents/images/alert-success.svg";
import { useAOMintingStatus } from "~utils/agents/hooks";
import { useMemo, useState } from "react";

export function AOMintingStatusModal() {
  const [open, setOpen] = useState(true);
  const { data, isError } = useAOMintingStatus();
  const status = useMemo(() => (data === "Paused" ? "Paused" : "Resumed"), [data]);

  function onClose() {
    setOpen(false);
  }

  if (isError || status === "Resumed" || !open) return null;

  return (
    <SliderMenu isOpen={open} onClose={onClose} paddingVertical={32}>
      <Flex direction="column" gap={32} height="100%" width="100%">
        <Flex direction="column" gap={8}>
          <img src={status === "Paused" ? alertWarning : alertSuccess} style={{ margin: "0 auto" }} />
          <Text size="lg" weight="semibold" style={{ fontSize: 22, textAlign: "center" }} noMargin>
            {browser.i18n.getMessage(`ao_minting_${status?.toLowerCase()}_title`)}
          </Text>
          <Text variant="secondary" weight="medium" style={{ textAlign: "center" }} noMargin>
            {browser.i18n.getMessage(`ao_minting_${status?.toLowerCase()}_description`, ["wUSDC"])}
          </Text>
          {status === "Paused" && (
            <Text weight="medium" style={{ textAlign: "center" }} noMargin>
              {browser.i18n.getMessage("ao_minting_paused_action_description")}
            </Text>
          )}
        </Flex>

        <Button onClick={onClose} fullWidth>
          {browser.i18n.getMessage("i_understand")}
        </Button>
      </Flex>
    </SliderMenu>
  );
}
