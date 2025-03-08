import { ButtonV2, ModalV2, Spacer } from "@arconnect/components";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import aoLogo from "url:/assets/ecosystem/ao-token-logo.png";
import { useStorage } from "~utils/storage";
import {
  ContentWrapper,
  Content,
  HeaderText,
  CenterText
} from "~components/modals/Components";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
  const [notifications, setNotifications] = useStorage<boolean>({
    key: "setting_notifications",
    instance: ExtensionStorage
  });

  const [checked, setChecked] = useState(!!notifications);
  const modalRef = useRef(null);

  useEffect(() => {
    if (notifications !== undefined) {
      setChecked(notifications);
    }
  }, [notifications]);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      ExtensionStorage.set("show_announcement", false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <ModalV2
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
    >
      <ContentWrapper ref={modalRef}>
        <Content>
          <div>
            <img
              src={aoLogo}
              alt="ao logo"
              style={{ width: "100px", height: "auto" }}
            />
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("keystone_ao_popup_title")}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage("keystone_ao_popup")}
            </CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
            setNotifications(checked);
            ExtensionStorage.set("show_announcement", false);
          }}
        >
          {browser.i18n.getMessage("got_it")}
        </ButtonV2>
      </ContentWrapper>
    </ModalV2>
  );
};
