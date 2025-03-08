import {
  Text,
  Spacer,
  Button,
  useModal,
  Modal,
  useToasts,
  type DisplayTheme
} from "@arconnect/components-rebrand";
import { TrashIcon } from "@iconicicons/react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { resetStorage } from "~utils/storage.utils";
import { RemoveButton } from "~routes/popup/settings/wallets/[address]";

export function ResetDashboardView() {
  // reset modal
  const resetModal = useModal();

  // toasts
  const { setToast } = useToasts();

  // reset Wander
  async function reset() {
    try {
      await resetStorage();

      // close window
      window.top.close();
    } catch (e) {
      console.log("Error resetting Wander", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("reset_error"),
        duration: 2300
      });
    }

    resetModal.setOpen(false);
  }

  return (
    <>
      <Warning>
        {browser.i18n.getMessage("reset_warning")}
        <br />
        <Spacer y={0.35} />
        <b>{browser.i18n.getMessage("irreversible_action")}</b>
      </Warning>
      <Spacer y={1.5} />
      <RemoveButton fullWidth onClick={() => resetModal.setOpen(true)}>
        <TrashIcon style={{ marginRight: "5px" }} />
        {browser.i18n.getMessage("reset")}
      </RemoveButton>
      <Modal
        {...resetModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <RemoveButton fullWidth onClick={reset}>
            {browser.i18n.getMessage("confirm")}
          </RemoveButton>
        }
      >
        <ModalText size="xl" weight="medium">
          {browser.i18n.getMessage("reset")}
        </ModalText>
        <ModalText>
          {browser.i18n.getMessage("setting_reset_description")}
        </ModalText>
        <Spacer y={0.75} />
      </Modal>
    </>
  );
}

const Warning = styled(Text)`
  color: #ff0000;
`;

export const ResetButton = styled(Button).attrs({
  secondary: true,
  fullWidth: true
})<{ displayTheme?: DisplayTheme }>`
  background-color: ${(props) => props.theme.delete};
  border: 1.5px solid ${(props) => props.theme.fail};
  color: #ffffff;

  &:hover {
    background-color: ${(props) => props.theme.secondaryDelete};
  }
`;

const ModalText = styled(Text)`
  text-align: center;
`;
