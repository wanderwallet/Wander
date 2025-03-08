import { ButtonV2, ModalV2, Spacer } from "@arconnect/components";
import { useRef } from "react";
import browser from "webextension-polyfill";
import aoLogo from "url:/assets/ecosystem/ao-token-logo.png";
import expLogo from "url:/assets/ecosystem/exp-token-logo.png";

import {
  HeaderText,
  CenterText,
  Content,
  ContentWrapper
} from "~components/modals/Components";

const tokenData = {
  AO: {
    learnMoreLink:
      "https://mirror.xyz/0x1EE4bE8670E8Bd7E9E2E366F530467030BE4C840/-UWra0q0KWecSpgg2-c37dbZ0lnOMEScEEkabVm9qaQ",
    image: aoLogo
  },
  EXP: {
    learnMoreLink: "https://x.com/ar_io_network/status/1879961321170706490",
    image: expLogo
  }
} as const;

export const AnnouncementPopup = ({ isOpen, setOpen, ticker }) => {
  const modalRef = useRef(null);

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
              src={(() => {
                switch (ticker) {
                  case "AO":
                    return tokenData.AO.image;
                  case "EXP":
                    return tokenData.EXP.image;
                  default:
                    return "";
                }
              })()}
              alt={`${ticker} logo`}
              style={{ width: "100px", height: "auto" }}
            />
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("token_send_popup_title", [ticker])}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage(`${ticker}_token_send_popup`)}
            </CenterText>
            <Spacer y={1} />
            <CenterText>
              <a
                href={(() => {
                  switch (ticker) {
                    case "AO":
                      return tokenData.AO.learnMoreLink;
                    case "EXP":
                      return tokenData.EXP.learnMoreLink;
                    default:
                      return "#";
                  }
                })()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {browser.i18n.getMessage("ao_token_send_popup_learn_more")}
              </a>
            </CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
          }}
        >
          {browser.i18n.getMessage("got_it")}
        </ButtonV2>
      </ContentWrapper>
    </ModalV2>
  );
};
