import { ButtonV2, ModalV2, Spacer } from "@arconnect/components";
import { useRef } from "react";
import browser from "webextension-polyfill";
import { ContentWrapper, Content, HeaderText, CenterText } from "./Components";

interface Props {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  back?: () => void;
}

export const WalletKeySizeErrorModal = ({ isOpen, setOpen, back }: Props) => {
  const modalRef = useRef(null);

  return (
    <ModalV2 root={document.getElementById("__plasmo")} open={isOpen} setOpen={setOpen}>
      <ContentWrapper ref={modalRef}>
        <Content>
          <div>
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("import_wallet_key_length_short_error_title")}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>{browser.i18n.getMessage("import_wallet_key_length_short_error")}</CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
            if (back) {
              back();
            }
          }}>
          {browser.i18n.getMessage("close")}
        </ButtonV2>
      </ContentWrapper>
    </ModalV2>
  );
};
