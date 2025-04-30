import Paragraph from "~components/Paragraph";
import { useEffect } from "react";
import browser from "webextension-polyfill";
import { type SetupWelcomeViewParams } from "../setup";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";

export type SecureWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function SecureWelcomeView({ params }: SecureWelcomeViewProps) {
  const { navigate } = useLocation();

  function handleSetUpPassword() {
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
          {browser.i18n.getMessage("secure_your_account_description")}
        </Paragraph>
      </Content>
      <Flex direction="column" gap={16} width="100%">
        <Button variant="secondary" fullWidth onClick={handleSetUpPassword}>
          {browser.i18n.getMessage("set_up_a_password")}
        </Button>
      </Flex>
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
