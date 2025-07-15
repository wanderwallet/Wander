import { useLocation } from "wouter";
import { useEffect } from "react";
import styled from "styled-components";
import { ButtonV2 } from "@arconnect/components";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useActiveWallet } from "~wallets/hooks";
import { formatAddress } from "~utils/format";
import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { Wander2Icon, ArioIcon } from "~components/embed";
import { PopupPaths } from "~wallets/router/popup/popup.routes";

const Content = styled.main`
  padding: 1.5rem;
  flex: 1;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const XIcon = styled.span`
  font-size: 1.5rem;
  color: rgb(var(--text-color-secondary, #666666));
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
  color: rgb(var(--text-color));
`;

const FieldContainer = styled.div`
  background-color: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const FieldLabel = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.secondaryTextv2};
`;

const FieldValue = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.secondaryTextv2};
  text-align: right;
`;

export const ArNSPurchaseStartView = () => {
  const [, navigate] = useLocation();
  const wallet = useActiveWallet();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  useEffect(() => {
    trackPage(PageType.HOME); // Using HOME as a fallback since PURCHASE_START doesn't exist
  }, []);

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Search for a name");
  };

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Purchase ArNS" />

      <Content>
        <LogoContainer>
          <Wander2Icon height="32px" width="68.28px" />
          <XIcon>×</XIcon>
          <ArioIcon />
        </LogoContainer>

        <SectionTitle>Get your ArNS name</SectionTitle>

        <Text style={{ textAlign: "center", color: "var(--color-font-body)", padding: "0 1rem" }}>
          ArNS (Arweave Name Service) gives you a human-readable name for your Arweave wallet and content.
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "var(--color-font-body)",
            padding: "0 1rem",
            marginTop: "1rem",
            marginBottom: "1rem",
          }}>
          Instead of sharing a long wallet address, you can use your ArNS name:
        </Text>

        <Flex gap="0.5rem" direction="column">
          <FieldContainer>
            <FieldLabel>Wallet address:</FieldLabel>
            <FieldValue>{formatAddress(activeAddress || "", 4)}</FieldValue>
          </FieldContainer>

          <FieldContainer>
            <FieldLabel>ArNS name:</FieldLabel>
            <FieldValue>ar://yourname</FieldValue>
          </FieldContainer>
        </Flex>

        <button
          onClick={() => window.open("https://docs.ar.io/arns", "_blank")}
          style={{
            color: "rgba(151, 135, 255, 1)",
            cursor: "pointer",
            paddingTop: ".5rem",
            margin: 0,
            fontSize: "1rem",
          }}>
          Learn More
        </button>

        <div style={{ flexGrow: 1 }} />

        <ButtonV2 fullWidth onClick={() => navigate(PopupPaths.ArNSPurchaseNameSearch)}>
          Search for a name
        </ButtonV2>
      </Content>
    </Flex>
  );
};
