import { Button, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { openOrSelectWelcomePage } from "~wallets";

export default function NoWallets() {
  return (
    <Layout>
      <Container>
        <NoWalletText title>{browser.i18n.getMessage("no_wallets_added")}</NoWalletText>
        <NoWalletText>{browser.i18n.getMessage("no_wallets_added_paragraph")}</NoWalletText>
        <Spacer y={0.85} />
        <SetupButton onClick={() => openOrSelectWelcomePage(true)}>{browser.i18n.getMessage("setup")}</SetupButton>
      </Container>
    </Layout>
  );
}

const Layout = styled.div`
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(${(props) => props.theme.background}, 0.8);
`;

const Container = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 86vw;
  transform: translate(-50%, -50%);
`;

const NoWalletText = styled(Text).attrs({
  noMargin: true,
})`
  text-align: center;
`;

const SetupButton = styled(Button).attrs({
  secondary: true,
})`
  margin: 0 auto;
`;
