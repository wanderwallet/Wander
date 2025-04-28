import Paragraph from "~components/Paragraph";
import { useEffect } from "react";
import browser from "webextension-polyfill";
import { type SetupWelcomeViewParams } from "../setup";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button, Tooltip } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { Fingerprint04 } from "@untitled-ui/icons-react";

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
        <Tooltip content={browser.i18n.getMessage("passkey_not_available_yet")}>
          <Button fullWidth icon={<Fingerprint04 />} disabled>
            {browser.i18n.getMessage("use_a_passkey")}
          </Button>
        </Tooltip>
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
