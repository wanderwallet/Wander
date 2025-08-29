import PasswordStrength from "../../../../../../libs/ui/src/lib/components/be/PasswordStrength";
import Paragraph from "~components/Paragraph";
import { useContext, useMemo, useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { PasswordContext, type SetupWelcomeViewParams } from "../setup";
import { useInput, useToasts } from "@arconnect/components";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button, Input, Spacer } from "@arconnect/components-rebrand";

export type PasswordWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function PasswordWelcomeView({ params }: PasswordWelcomeViewProps) {
  const { navigate } = useLocation();

  // input controls
  const passwordInput = useInput();
  const validPasswordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // password context
  const { setPassword } = useContext(PasswordContext);

  const [passwordType, setPasswordType] = useState("password");

  // handle done button
  function done(skip: boolean = false) {
    // check if passwords match
    if (passwordInput.state !== validPasswordInput.state) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("passwords_not_match"),
        duration: 2300,
      });
    }

    // check password validty
    if (passwordInput.state.length < 5) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("password_not_strong"),
        duration: 2300,
      });
    }

    // if (!checkPasswordValid(passwordInput.state) && !skip) {
    //   passwordModal.setOpen(true);
    //   return;
    // }

    // set password in global context
    setPassword(passwordInput.state);

    // next page
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
  }

  // passwords match
  const passwordsMatch = useMemo(
    () => passwordInput.state === validPasswordInput.state && passwordInput.state?.length >= 5,
    [passwordInput, validPasswordInput],
  );

  const isPasswordValid = passwordsMatch && passwordInput.state.length >= 5;

  // Segment
  // TODO: specify if this is an imported or new wallet
  useEffect(() => {
    trackPage(PageType.ONBOARD_PASSWORD);
  }, []);

  return (
    <Container>
      <Content>
        <Paragraph>{browser.i18n.getMessage("create_password_paragraph")}</Paragraph>
        <div>
          <Input
            type="password"
            {...passwordInput.bindings}
            placeholder={browser.i18n.getMessage("enter_your_password")}
            fullWidth
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              done();
            }}
            autoFocus
          />
          <Spacer y={0.75} />
          <Input
            type={passwordType}
            {...validPasswordInput.bindings}
            placeholder={browser.i18n.getMessage("enter_password_again")}
            fullWidth
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              done();
            }}
          />
        </div>
        <div>
          <PasswordStrength password={passwordInput.state} passwordsMatch={passwordsMatch} minLength={5} />
        </div>
      </Content>
      <Button fullWidth onClick={() => done()} disabled={!isPasswordValid}>
        {browser.i18n.getMessage(isPasswordValid ? "next" : "enter_password")}
      </Button>
      {/* <PasswordWarningModal
        done={done}
        {...passwordModal.bindings}
        passwordStatus={{
          contains: passwordStatus.contains,
          length: passwordStatus.length
        }}
      /> */}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 24px;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
`;
