import { ButtonV2, ModalV2, Spacer } from "@arconnect/components";
import { useRef } from "react";
import browser from "webextension-polyfill";
import expLogo from "url:/assets/ecosystem/exp-token-logo.png";
import piLogo from "url:/assets/ecosystem/pi-token-logo.png";
import { HeaderText, CenterText, Content, ContentWrapper } from "~components/modals/Components";
import { useTheme } from "styled-components";

type TokenData = {
  learnMoreLink: string;
  image: string;
};

const tokenData: Record<string, TokenData> = {
  EXP: {
    learnMoreLink: "https://x.com/ar_io_network/status/1879961321170706490",
    image: expLogo,
  },
  PI: {
    learnMoreLink: "https://www.autonomous.finance/research/en-US/permaweb-index",
    image: piLogo,
  },
} as const;

const defaultTokenData: TokenData = {
  learnMoreLink: "",
  image: "",
};

type AnnouncementPopupProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  ticker: string;
};

export const AnnouncementPopup = ({ isOpen, setOpen, ticker }: AnnouncementPopupProps) => {
  const modalRef = useRef(null);
  const theme = useTheme();
  const data = tokenData[ticker] || defaultTokenData;

  return (
    <ModalV2 root={document.getElementById("__plasmo")} open={isOpen} setOpen={setOpen}>
      <ContentWrapper ref={modalRef}>
        <Content>
          <div>
            <img src={data.image} alt={`${ticker} logo`} style={{ width: "100px", height: "auto" }} />
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("token_send_popup_title", [ticker])}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>{browser.i18n.getMessage(`${ticker}_token_send_popup`)}</CenterText>
            <Spacer y={1} />
            <CenterText>
              <a
                href={data.learnMoreLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.primary }}
                onClick={(e) => e.stopPropagation()}>
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
          }}>
          {browser.i18n.getMessage("got_it")}
        </ButtonV2>
      </ContentWrapper>
    </ModalV2>
  );
};
