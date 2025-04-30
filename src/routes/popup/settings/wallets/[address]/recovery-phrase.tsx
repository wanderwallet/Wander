import { useEffect, useState } from "react";
import HeadV2 from "~components/popup/HeadV2";
import { Wrapper } from "~routes/popup/receive";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import copy from "copy-to-clipboard";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import { Button, Spacer, Text } from "@arconnect/components-rebrand";
import {
  AlertTriangle,
  Check,
  Copy01,
  Eye,
  EyeOff
} from "@untitled-ui/icons-react";
import styled from "styled-components";
import { PageType, trackPage } from "~utils/analytics";
import { useStorage, ExtensionStorage } from "~utils/storage";
import { decryptRecoveryPhrase } from "~wallets/encryption";
import { getDecryptionKey } from "~wallets/auth";

export interface RecoveryPhraseViewParams {
  address: string;
}

export type RecoveryPhraseViewProps =
  CommonRouteProps<RecoveryPhraseViewParams>;

export function RecoveryPhraseView({}: RecoveryPhraseViewProps) {
  const { navigate } = useLocation();
  const [activeAddress] = useStorage(
    {
      key: "active_address",
      instance: ExtensionStorage
    },
    ""
  );

  const [isFinishEnabled, setIsFinishEnabled] = useState(false);
  const [seedphrase, setSeedphrase] = useState<string>("");

  // seed blur status
  const [shown, setShown] = useState(false);

  // icon displayed for "copy seedphrase"
  const [copyDisplay, setCopyDisplay] = useState(true);

  async function getSeedphrase() {
    const seedphrase = await ExtensionStorage.get(
      `recovery_phrase_${activeAddress}`
    );

    if (!seedphrase) return;

    const decryptionKey = await getDecryptionKey();
    const decrypted = await decryptRecoveryPhrase(seedphrase, decryptionKey);

    setSeedphrase(decrypted);
  }

  // copy the seedphrase
  function copySeed() {
    copy(seedphrase);
    setCopyDisplay(false);
    setTimeout(() => setCopyDisplay(true), 1050);
    setIsFinishEnabled(true);
  }

  function finish() {
    ExtensionStorage.removeItem(`recovery_phrase_${activeAddress}`);
    ExtensionStorage.removeItem(`recovery_phrase_backedup_${activeAddress}`);
    navigate("/");
  }

  useEffect(() => {
    if (!activeAddress) return;

    getSeedphrase();
  }, [activeAddress]);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_BACKUP);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("recovery_phrase")}
        showOptions={false}
      />
      <Wrapper style={{ height: "calc(100vh - 100px)" }}>
        <Container>
          <Content>
            <Paragraph>
              {browser.i18n.getMessage("backup_wallet_content")}
            </Paragraph>
            <div>
              <SeedContainer onClick={() => setShown((val) => !val)}>
                <Seed shown={shown}>{seedphrase}</Seed>
                <SeedShownIcon
                  as={shown ? Eye : EyeOff}
                  onClick={() => setIsFinishEnabled(true)}
                />
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
          <Button fullWidth onClick={finish} disabled={!isFinishEnabled}>
            {browser.i18n.getMessage("finish")}
          </Button>
        </Container>
      </Wrapper>
    </>
  );
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding-left: 24px;
  padding-right: 24px;
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
