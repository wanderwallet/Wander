import { ButtonV2, ModalV2, Spacer, Text, type DisplayTheme } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { CheckIcon, CloseIcon } from "@iconicicons/react";
import { ResetButton } from "~components/dashboard/Reset";
import { Content, ContentWrapper } from "~components/modals/Components";

export const PasswordWarningModal = ({
  open,
  setOpen,
  passwordStatus,
  done,
}: {
  open: boolean;
  setOpen: (close: boolean) => void;
  passwordStatus: { contains: string[]; length: number };
  done: (skip: boolean) => void;
}) => {
  return (
    <ModalV2 root={document.getElementById("__plasmo")} open={open} setOpen={setOpen}>
      <ContentWrapper>
        <Content>
          <div>
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("password_warning_title")}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>{browser.i18n.getMessage("password_warning_description")}</CenterText>
            <Spacer y={0.7} />
            <BulletPoints>
              <StrengthCheck isValid={passwordStatus.contains.includes("uppercase")}>
                {passwordStatus.contains.includes("uppercase") ? <CheckIcon /> : <CloseIcon />}
                {browser.i18n.getMessage("password_strength_checklist_case")}
              </StrengthCheck>
              <StrengthCheck isValid={passwordStatus.contains.includes("symbol")}>
                {passwordStatus.contains.includes("symbol") ? <CheckIcon /> : <CloseIcon />}
                {browser.i18n.getMessage("password_strength_checklist_symbol")}
              </StrengthCheck>
              <StrengthCheck isValid={passwordStatus.contains.includes("number")}>
                {passwordStatus.contains.includes("number") ? <CheckIcon /> : <CloseIcon />}
                {browser.i18n.getMessage("password_strength_checklist_number")}
              </StrengthCheck>
              <StrengthCheck isValid={passwordStatus.length >= 10}>
                {passwordStatus.length >= 10 ? <CheckIcon /> : <CloseIcon />}
                {browser.i18n.getMessage("password_strength_checklist_length", "10")}
              </StrengthCheck>
            </BulletPoints>
            <Spacer y={1} />
          </div>
        </Content>
      </ContentWrapper>
      <ButtonsWrapper>
        <ButtonV2
          fullWidth
          onClick={() => {
            done(true);
            setOpen(false);
          }}>
          {browser.i18n.getMessage("continue")}
        </ButtonV2>
        <ResetButton
          onClick={() => {
            setOpen(false);
          }}>
          {browser.i18n.getMessage("cancel")}
        </ResetButton>
      </ButtonsWrapper>
    </ModalV2>
  );
};

const BulletPoints = styled.div`
  width: 100%;
  font-weight: 500;
  font-size: 11px;
  text-align: left;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CenterText = styled(Text).attrs({
  noMargin: true,
})<{ displayTheme?: DisplayTheme }>`
  width: 245px;
  text-align: center;
  color: ${(props) => (props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF")};
  font-weight: 500;
  text-align: left;
  font-size: 11px;
  line-height: 16px;
  align-self: stretch;
  flex: none;
  flex-grow: 0;
`;

const HeaderText = styled(Text)<{ displayTheme?: DisplayTheme }>`
  font-size: 18px;
  font-weight: 500;
  color: ${(props) => (props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF")};
`;

const StrengthCheck = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  p {
    font-size: 0.84rem;
    color: rgb(${(props) => (props.isValid ? "0, 255, 0" : props.theme.secondaryText)});
    line-height: 1.1em;
    transition: all 0.17s ease-in-out;
  }

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
    color: rgb(${(props) => (props.isValid ? "0, 255, 0" : "255, 0, 0")});
    transition: all 0.17s ease-in-out;
  }
`;
