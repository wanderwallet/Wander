import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "@iconicicons/react";
import { Spacer, Text } from "@arconnect/components";
import { useState } from "react";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";

export default function BackupWalletPage({ seed }: Props) {
  // seed blur status
  const [shown, setShown] = useState(false);

  // icon displayed for "copy seedphrase"
  const [copyDisplay, setCopyDisplay] = useState(true);

  // copy the seedphrase
  function copySeed() {
    copy(seed);
    setCopyDisplay(false);
    setTimeout(() => setCopyDisplay(true), 1050);
  }

  return (
    <>
      <Paragraph>{browser.i18n.getMessage("backup_wallet_content")}</Paragraph>
      <SeedContainer onClick={() => setShown((val) => !val)}>
        <Seed shown={shown}>{seed}</Seed>
        <SeedShownIcon as={shown ? EyeIcon : EyeOffIcon} />
      </SeedContainer>
      <Spacer y={0.5} />
      <CopySeed onClick={copySeed}>
        {(copyDisplay && <CopyIcon />) || <CheckIcon />}
        {browser.i18n.getMessage("copySeed")}
      </CopySeed>
    </>
  );
}

const SeedContainer = styled.div`
  position: relative;
  padding: 0.6rem 0.8rem;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
`;

const SeedShownIcon = styled(EyeIcon)`
  position: absolute;
  right: 0.8rem;
  bottom: 0.6rem;
  font-size: 1.1rem;
  width: 1em;
  height: 1em;
  color: ${(props) => props.theme.primaryText};
`;

const Seed = styled.p<{ shown: boolean }>`
  margin: 0;
  color: ${(props) => props.theme.primaryText};
  font-weight: 500;
  font-size: 0.92rem;
  line-height: 1.5em;
  filter: blur(${(props) => (!props.shown ? "10px" : "0")});
`;

const CopySeed = styled(Text).attrs({
  noMargin: true
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

interface Props {
  seed: string;
}
