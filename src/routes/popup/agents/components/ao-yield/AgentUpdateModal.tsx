import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Button, Text, useToasts } from "@arconnect/components-rebrand";
import { useState } from "react";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import { deployContract } from "~utils/agents/deploy";
import aoYieldAgentContract from "raw:/assets/agents/contracts/ao-yield-agent.lua";
import { AGENT_VERSION } from "~utils/agents/constants";
import { updateAOYieldAgent } from "~utils/agents/utils";
import { useAoRateLimitedToast } from "~utils/toast/toast.hooks";

interface AgentUpdateModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
}

export function AgentUpdateModal({ open, onClose, agentId }: AgentUpdateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toasts = useToasts();
  const { showAoRateLimitedToast } = useAoRateLimitedToast();

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!agentId) return;

    setIsLoading(true);
    try {
      // Update agent code to the latest version
      await deployContract({
        name: "ao-yield-agent",
        contractPath: aoYieldAgentContract,
        processId: agentId,
        retry: {
          count: 3,
          delay: 1000,
        },
      });

      // Update agent version to the latest version
      await updateAOYieldAgent(agentId, { version: AGENT_VERSION, fullPatch: true });

      toasts.setToast({
        content: browser.i18n.getMessage("success_updating_agent"),
        type: "success",
        duration: 2400,
      });
      onClose();
    } catch (error) {
      toasts.setToast({
        content: browser.i18n.getMessage("error_updating_agent"),
        type: "error",
        duration: 2400,
      });
      showAoRateLimitedToast(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SliderMenu isOpen={open} onClose={onClose} paddingVertical={32}>
      <form onSubmit={handleUpdate} noValidate>
        <Flex direction="column" gap={24} height="100%" width="100%">
          <Flex direction="column" gap={16} align="center">
            <img src={HedgehogHeadIcon} alt="Hedgehog Head" height={80} width={80} />
            <Text size="lg" weight="semibold" style={{ fontSize: 22, textAlign: "center" }} noMargin>
              {browser.i18n.getMessage("agent_update_title")}
            </Text>
            <Text variant="secondary" weight="medium" style={{ textAlign: "center" }} noMargin>
              {browser.i18n.getMessage("agent_update_description")}
            </Text>
          </Flex>

          <Button type="submit" loading={isLoading} disabled={isLoading} fullWidth>
            {browser.i18n.getMessage("update_agent")}
          </Button>
        </Flex>
      </form>
    </SliderMenu>
  );
}
