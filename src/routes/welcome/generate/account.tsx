import Paragraph from "~components/Paragraph";
import { useContext, useEffect } from "react";
import browser from "webextension-polyfill";
import { WalletContext, type SetupWelcomeViewParams } from "../setup";
import { useInput } from "@arconnect/components";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button, Input } from "@arconnect/components-rebrand";

export type AccountWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function AccountWelcomeView({ params }: AccountWelcomeViewProps) {
  const { navigate } = useLocation();

  const { setAccountName } = useContext(WalletContext);

  // input controls
  const accountInput = useInput("Account 1");

  // handle done button
  function done() {
    if (!accountInput.state) return;

    setAccountName(accountInput.state);

    // next page
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
  }

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_NEW_ACCOUNT);
  }, []);

  return (
    <Container>
      <Content>
        <Paragraph>
          {browser.i18n.getMessage("create_a_new_account_description")}
        </Paragraph>
        <Input
          type="text"
          {...accountInput.bindings}
          placeholder={"Account 1"}
          fullWidth
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            done();
          }}
        />
      </Content>
      <Button fullWidth onClick={() => done()}>
        {browser.i18n.getMessage("continue")}
      </Button>
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
  align-items: center;
  gap: 24px;
`;
