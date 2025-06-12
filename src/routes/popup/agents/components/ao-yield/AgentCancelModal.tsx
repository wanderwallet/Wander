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
import { EventType, trackEvent } from "~utils/analytics";

interface AgentCancelModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
}

export function AgentCancelModal({ open, onClose, agentId }: AgentCancelModalProps) {
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
      await trackEvent(EventType.AO_YIELD_AGENT_CANCEL, {});
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
    <SliderMenu isOpen={open} onClose={onClose} paddingVertical={32}>
      <Flex direction="column" gap={24} height="100%" width="100%">
        <Flex direction="column" gap={16}>
          <img src={alertTriangle} style={{ margin: "0 auto" }} />
          <Text size="lg" weight="semibold" style={{ fontSize: 22, textAlign: "center" }} noMargin>
            {browser.i18n.getMessage("agent_cancel_title")}
          </Text>
          <Text variant="secondary" weight="medium" style={{ textAlign: "center" }} noMargin>
            {browser.i18n.getMessage("agent_cancel_description")}
          </Text>
        </Flex>
        {askPassword && transferRequirePassword && (
          <Input
            placeholder={browser.i18n.getMessage("password")}
            sizeVariant="small"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("enter_password_confirm")}
            labelStyle={{ marginBottom: -12, color: theme.primaryText, fontSize: 16, fontWeight: 500 }}
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
    </SliderMenu>
  );
}
