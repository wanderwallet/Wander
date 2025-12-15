import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Button, Text } from "@wanderapp/components";
import alertWarning from "url:/assets/agents/images/alert-warning.svg";
import alertSuccess from "url:/assets/agents/images/alert-success.svg";
import { useState } from "react";
import type { AOYieldAgent, MintingStatus } from "~utils/agents/types";
import { tokenIdInfoMap } from "~utils/agents/utils";
import { ExtensionStorage, useStorage } from "~utils/storage";

interface AOMintingStatusModalProps {
  agent: AOYieldAgent;
  mintingStatus: MintingStatus;
  isError: boolean;
}

export function AOMintingStatusModal({ agent, mintingStatus, isError }: AOMintingStatusModalProps) {
  const [open, setOpen] = useState(true);
  const status = mintingStatus === "Paused" ? "Paused" : "Resumed";

  const [showMintResumed, setShowMintResumed] = useStorage(
    {
      key: "show_mint_resumed",
      instance: ExtensionStorage,
    },
    false,
  );

  function onClose() {
    setOpen(false);
    // Clear the resume flag when user acknowledges
    if (status === "Resumed" && showMintResumed) {
      setShowMintResumed(false);
    }
  }

  // Show modal for paused status or when resume notification is needed
  const shouldShowModal =
    !isError && open && agent && (status === "Paused" || (status === "Resumed" && showMintResumed));

  if (!shouldShowModal) return null;

  return (
    <SliderMenu isOpen={open} onClose={onClose} paddingVertical={32}>
      <Flex direction="column" gap={32} height="100%" width="100%">
        <Flex direction="column" gap={8}>
          <img src={status === "Paused" ? alertWarning : alertSuccess} style={{ margin: "0 auto" }} />
          <Text size="lg" weight="semibold" style={{ fontSize: 22, textAlign: "center" }} noMargin>
            {browser.i18n.getMessage(`ao_minting_${status?.toLowerCase()}_title`)}
          </Text>
          <Text variant="secondary" weight="medium" style={{ textAlign: "center" }} noMargin>
            {browser.i18n.getMessage(`ao_minting_${status?.toLowerCase()}_description`, [
              tokenIdInfoMap[agent?.tokenOut]?.ticker || "",
            ])}
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
