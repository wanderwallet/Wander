import { useLocation } from "~wallets/router/router.utils";
import { useEffect } from "react";
import styled from "styled-components";
import { Button, Text } from "@wanderapp/components";
import HeadV2 from "~components/popup/HeadV2";
import { useActiveAddress } from "~wallets/hooks";
import { formatAddress } from "~utils/format";
import { Flex } from "~components/common/Flex";
import { Wander2Icon, ArioIcon } from "~components/embed";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import browser from "webextension-polyfill";
import { trackPage, PageType } from "~utils/analytics";
import { ExtensionStorage } from "~utils/storage";

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
  const { navigate } = useLocation();
  const activeAddress = useActiveAddress();

  async function handleSearchClick() {
    await ExtensionStorage.set("arns_purchase_start_shown", true);
    navigate(PopupPaths.ArNSPurchaseNameSearch);
  }

  useEffect(() => {
    trackPage(PageType.ARNS_HOME);
  }, []);

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title={browser.i18n.getMessage("purchase_arns")} />

      <Content>
        <LogoContainer>
          <Wander2Icon height="32px" width="68.28px" />
          <XIcon>×</XIcon>
          <ArioIcon />
        </LogoContainer>

        <SectionTitle>{browser.i18n.getMessage("get_your_arns_name")}</SectionTitle>

        <Text style={{ textAlign: "center", color: "var(--color-font-body)", padding: "0 1rem" }}>
          {browser.i18n.getMessage("arns_purchase_description")}
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "var(--color-font-body)",
            padding: "0 1rem",
            marginTop: "1rem",
            marginBottom: "1rem",
          }}>
          {browser.i18n.getMessage("arns_purchase_description_2")}
        </Text>

        <Flex gap="0.5rem" direction="column">
          <FieldContainer>
            <FieldLabel>{browser.i18n.getMessage("arns_wallet_address")}:</FieldLabel>
            <FieldValue>{formatAddress(activeAddress || "", 4)}</FieldValue>
          </FieldContainer>

          <FieldContainer>
            <FieldLabel>{browser.i18n.getMessage("arns_name")}:</FieldLabel>
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
          {browser.i18n.getMessage("learn_more")}
        </button>

        <div style={{ flexGrow: 1 }} />

        <Button fullWidth onClick={handleSearchClick}>
          {browser.i18n.getMessage("search_for_a_name")}
        </Button>
      </Content>
    </Flex>
  );
};
