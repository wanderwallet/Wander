import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import SliderMenu from "~components/SliderMenu";
import { Button, Input, Text, useInput, useToasts } from "@arconnect/components-rebrand";
import { updateAOYieldAgent } from "~utils/agents/utils";
import { useState } from "react";
import { useAskPassword } from "~wallets/hooks";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { useTheme } from "styled-components";
import { checkPassword } from "~wallets/auth";
import alertTriangle from "url:/assets/agents/images/alert-triangle.svg";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

interface AgentCancelModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
}

export function AgentCancelModal({ open, onClose, agentId }: AgentCancelModalProps) {
  return (
    <SliderMenu isOpen={open} onClose={onClose}>
      <AgentCancelScreen onClose={onClose} agentId={agentId} />
    </SliderMenu>
  );
}

const AgentCancelScreen = ({ onClose, agentId }: { onClose: () => void; agentId: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const askPassword = useAskPassword();
  const passwordInput = useInput();
  const toasts = useToasts();
  const theme = useTheme();
  const { navigate } = useLocation();
  const [transferRequirePassword] = useStorage(
    {
      key: "transfer_require_password",
      instance: ExtensionStorage,
    },
    false,
  );

  async function handleCancel() {
    setIsLoading(true);
    try {
      if (askPassword && transferRequirePassword) {
        const checkPw = await checkPassword(passwordInput.state);
        if (!checkPw) {
          toasts.setToast({
            type: "error",
            content: browser.i18n.getMessage("invalidPassword"),
            duration: 2400,
          });
          return;
        }
      }

      await updateAOYieldAgent(agentId, { status: "Cancelled" });
      toasts.setToast({
        content: browser.i18n.getMessage("agent_cancelled"),
        type: "success",
        duration: 2400,
      });
      onClose();
      navigate(PopupPaths.Agents);
    } catch {
      toasts.setToast({
        content: browser.i18n.getMessage("error_updating_agent"),
        type: "error",
        duration: 2400,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Flex direction="column" gap={16} height="100%" width="100%">
      <img src={alertTriangle} height={90} width={76} style={{ margin: "0 auto" }} />
      <Text size="lg" weight="semibold" style={{ fontSize: 22, textAlign: "center" }} noMargin>
        Are you sure your want to cancel your agent?
      </Text>
      <Text variant="secondary" weight="medium" style={{ fontSize: 22, textAlign: "center" }} noMargin>
        Cancelling your agent will stop your automatic AO token conversions. You can also create a new agent.
      </Text>
      {askPassword && transferRequirePassword && (
        <Input
          placeholder="Password"
          sizeVariant="small"
          {...passwordInput.bindings}
          label={browser.i18n.getMessage("enter_password_confirm")}
          labelStyle={{ marginBottom: -4, color: theme.primaryText }}
          type="password"
          onKeyDown={async (e) => {
            if (e.key !== "Enter") return;
            await handleCancel();
          }}
          fullWidth
        />
      )}
      <Button onClick={handleCancel} loading={isLoading} disabled={isLoading} fullWidth>
        {browser.i18n.getMessage("cancel_agent")}
      </Button>
    </Flex>
  );
};
