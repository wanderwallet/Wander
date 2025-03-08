import Paragraph from "~components/Paragraph";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { type SetupWelcomeViewParams, type WelcomeSetupMode } from "../setup";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import styled from "styled-components";
import { Button, ListItem, ListItemIcon } from "@arconnect/components-rebrand";
import { FolderShield, Key01, QrCode02 } from "@untitled-ui/icons-react";
import KeystoneIcon from "url:assets/setup/keystone.svg";

export type OptionsWelcomViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function OptionsWelcomView({ params }: OptionsWelcomViewProps) {
  const { navigate } = useLocation();
  const [selected, setSelected] = useState<WelcomeSetupMode | null>(null);

  // handle done button
  function done() {
    if (!selected) return;
    // next page
    navigate(`/${selected}/1`);
  }

  // Segment
  useEffect(() => {
    // trackPage(PageType.ONBOARD_PASSWORD);
  }, []);

  return (
    <Container>
      <Content>
        <Paragraph>
          {browser.i18n.getMessage("choose_how_to_add_your_account")}
        </Paragraph>
        <ListContainer>
          <ListItem
            title={"Recovery phrase"}
            description=""
            onClick={() => setSelected("recoveryPhraseLoad")}
            active={selected === "recoveryPhraseLoad"}
          >
            <Icon as={FolderShield} />
          </ListItem>
          <ListItem
            title={"Keyfile"}
            description=""
            onClick={() => setSelected("keyfileLoad")}
            active={selected === "keyfileLoad"}
          >
            <Icon as={Key01} />
          </ListItem>
          <ListItem
            title={"QR Code"}
            description=""
            onClick={() => setSelected("qrLoad")}
            active={selected === "qrLoad"}
          >
            <Icon as={QrCode02} />
          </ListItem>
          <ListItem
            title={"Keystone Wallet"}
            description=""
            onClick={() => setSelected("keystoneLoad")}
            active={selected === "keystoneLoad"}
            hideSquircle
          >
            <Image src={KeystoneIcon} alt="Keystone Wallet" />
          </ListItem>
        </ListContainer>
      </Content>
      <Button fullWidth onClick={done} disabled={!selected}>
        {browser.i18n.getMessage("continue")}
      </Button>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
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

const Icon = styled(ListItemIcon)`
  height: 28px;
  width: 28px;
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Image = styled.img`
  height: 48px;
  width: 48px;
  object-fit: contain;
`;
