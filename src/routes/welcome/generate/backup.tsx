import { useContext, useEffect, useRef, useState } from "react";
import { WalletContext, type SetupWelcomeViewParams } from "../setup";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Button, Spacer, Text } from "@arconnect/components-rebrand";
import {
  AlertTriangle,
  Check,
  Copy01,
  Eye,
  EyeOff
} from "@untitled-ui/icons-react";

export type BackupWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function BackupWelcomeView({ params }: BackupWelcomeViewProps) {
  const { navigate } = useLocation();

  // seed blur status
  const [shown, setShown] = useState(false);

  // wallet context
  const { wallet: generatedWallet } = useContext(WalletContext);

  // ref to track the latest generated wallet
  const walletRef = useRef(generatedWallet);

  // icon displayed for "copy seedphrase"
  const [copyDisplay, setCopyDisplay] = useState(true);

  // copy the seedphrase
  function copySeed() {
    copy(generatedWallet.mnemonic || "");
    setCopyDisplay(false);
    setTimeout(() => setCopyDisplay(true), 1050);
  }

  useEffect(() => {
    walletRef.current = generatedWallet;
  }, [generatedWallet]);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_BACKUP);
  }, []);

  return (
    <Container>
      <Content>
        <Paragraph>
          {browser.i18n.getMessage("backup_wallet_content")}
        </Paragraph>
        <div>
          <SeedContainer onClick={() => setShown((val) => !val)}>
            <Seed shown={shown}>{generatedWallet.mnemonic || ""}</Seed>
            <SeedShownIcon as={shown ? Eye : EyeOff} />
          </SeedContainer>
          <Spacer y={0.5} />
          <CopySeed onClick={copySeed}>
            {browser.i18n.getMessage("copySeed")}
            {(copyDisplay && <CopyIcon />) || <Check color="#56C980" />}
          </CopySeed>
        </div>
        <WarningContainer>
          <AlertTriangle color="#EEBD41" />
          <Text size="sm" weight="medium" style={{ flex: 1 }} noMargin>
            {browser.i18n.getMessage("backup_wallet_warning")}
          </Text>
        </WarningContainer>
      </Content>
      <Button
        fullWidth
        onClick={() =>
          navigate(`/${params.setupMode}/${Number(params.page) + 1}`)
        }
      >
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
  gap: 24px;
`;

const SeedContainer = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  align-content: flex-start;
  align-self: stretch;
  flex-wrap: wrap;
  padding: 1rem;
  border: 1px solid ${(props) => props.theme.input.border.dropdown.default};
  background: ${(props) => props.theme.input.background.dropdown.default};
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
`;

const SeedShownIcon = styled(Eye)`
  position: absolute;
  right: 0.8rem;
  bottom: 0.6rem;
  font-size: 1.1rem;
  width: 1em;
  height: 1em;
  color: ${(props) => props.theme.input.placeholder.default};
`;

const CopyIcon = styled(Copy01)`
  color: ${(props) => props.theme.input.placeholder.default};
`;

const Seed = styled(Text).attrs({ size: "sm" })<{ shown: boolean }>`
  margin: 0;
  font-weight: 500;
  line-height: 1.5rem;
  word-spacing: 0.5rem;
  filter: blur(${(props) => (!props.shown ? "7px" : "0")});
`;

const CopySeed = styled(Text).attrs({
  noMargin: true,
  variant: "secondary",
  weight: "medium"
})`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: max-content;
  cursor: pointer;

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
  }
`;

const WarningContainer = styled.div`
  display: flex;
  padding: 8px 12px;
  justify-content: center;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  border-radius: 8px;
  background: ${(props) =>
    props.theme.displayTheme === "dark" ? "#363225" : "#F5F5F5"};
`;
