import { Card, Text, Button } from "@arconnect/components-rebrand";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { truncateMiddle } from "~utils/format";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import type { PurchaseType } from "./types";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import { decodeDomainToASCII, encodeDomainToASCII } from "./utils";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";
import { ArNSSuccessIcon } from "./ArNSSuccessIcon";
import { AO_LINK_URL } from "~constants/urls";

export interface ArNSPurchaseSuccessParams {
  name: string;
  purchaseType: PurchaseType;
  purchaseYears?: number;
  transactionId: string;
}
export type ArNSPurchaseSuccessProps = CommonRouteProps<ArNSPurchaseSuccessParams>;

export const ArNSPurchaseSuccessView = ({
  params: { name, purchaseType, purchaseYears, transactionId },
}: ArNSPurchaseSuccessProps) => {
  const { navigate } = useLocation();

  useEffect(() => {
    trackPage(PageType.ARNS_PURCHASE_SUCCESS);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "100vh",
        padding: "1.5rem",
        boxSizing: "border-box",
      }}>
      <Flex justify="center" align="center">
        <ArNSSuccessIcon />
      </Flex>
      <Text size="lg" weight="semibold" style={{ margin: "0.5rem", textAlign: "center" }}>
        {browser.i18n.getMessage("name_registered")}
      </Text>

      <Text size="lg" style={{ wordBreak: "break-all", textAlign: "center" }}>
        ar://{decodeDomainToASCII(name)}
      </Text>
      <Text variant="secondary" style={{ textAlign: "center" }}>
        {browser.i18n.getMessage("is_now_registered_to_this_wallet")}
      </Text>

      <RegisteringCard>
        <Text size="sm" variant="secondary" style={{ textAlign: "left", flexGrow: 1 }}>
          {browser.i18n.getMessage("registration_period")}
        </Text>
        <Text size="sm" weight="semibold">
          {purchaseType === "lease"
            ? `${browser.i18n.getMessage("lease")} (${purchaseYears} ${purchaseYears == 1 ? browser.i18n.getMessage("year") : browser.i18n.getMessage("years")})`
            : `${browser.i18n.getMessage("buy")} (∞)`}
        </Text>
      </RegisteringCard>
      <Flex style={{ justifyContent: "space-between" }}>
        <Text variant="secondary" size="sm">
          {browser.i18n.getMessage("transaction_id")}
        </Text>
        <Text size="sm" style={{ textAlign: "right" }}>
          {truncateMiddle(transactionId, 13)}
        </Text>
      </Flex>
      <a
        href={`${AO_LINK_URL}/#/message/${transactionId}`}
        target="_blank"
        title="View transaction on ao.link"
        rel="noopener noreferrer"
        style={{ margin: "1rem 0", textDecoration: "none" }}>
        <Flex gap="0.25rem">
          <Text size="sm" style={{ color: "rgba(151, 135, 255, 1)" }}>
            {browser.i18n.getMessage("see_transaction_details")}
          </Text>
          <Text>
            <LinkExternal02 width=".75rem" height=".75rem" />
          </Text>
        </Flex>
      </a>
      <div style={{ flex: 1 }}></div>
      <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
        <Flex direction="column" gap="0.5rem">
          <Button
            onClick={() => {
              navigate(PopupPaths.Home);
              navigate(PopupPaths.ArNSManage);
              navigate(PopupPaths.ArNSConfirmSetPrimaryName, { params: { name: encodeDomainToASCII(name) } });
            }}
            fullWidth>
            {browser.i18n.getMessage("set_as_primary_name")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              navigate(PopupPaths.Home);
              navigate(PopupPaths.ArNSManage);
            }}
            fullWidth>
            {browser.i18n.getMessage("manage_arns")}
          </Button>
          <Button variant="secondary" onClick={() => navigate(PopupPaths.Home)} fullWidth>
            {browser.i18n.getMessage("go_to_dashboard")}
          </Button>
        </Flex>
      </div>
    </div>
  );
};

const RegisteringCard = styled(Card)`
  display: flex;
  flex-direction: row;
  padding: 1rem;
  margin: 1rem 0;
  background: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  gap: 0.5rem;
  justify-content: space-between;
`;
