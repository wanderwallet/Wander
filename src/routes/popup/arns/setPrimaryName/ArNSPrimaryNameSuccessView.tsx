import { Button } from "@wanderapp/components";
import { Text } from "@wanderapp/components";
import { Flex } from "~components/common/Flex";
import { truncateMiddle } from "~utils/format";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import { decodeDomainToASCII } from "../utils";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";
import { ArNSSuccessIcon } from "../ArNSSuccessIcon";
import { AO_LINK_URL } from "~constants/urls";

export interface ArNSPrimaryNameSuccessParams {
  name: string;
  transactionId: string;
}
export type ArNSPrimaryNameSuccessProps = CommonRouteProps<ArNSPrimaryNameSuccessParams>;

export const ArNSPrimaryNameSuccessView = ({ params: { name, transactionId } }: ArNSPrimaryNameSuccessProps) => {
  const { navigate, back } = useLocation();

  useEffect(() => {
    trackPage(PageType.ARNS_SET_PRIMARY_NAME_SUCCESS);
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
        {browser.i18n.getMessage("primary_name_set")}
      </Text>

      <Text size="lg" style={{ wordBreak: "break-all", textAlign: "center" }}>
        {decodeDomainToASCII(name)}
      </Text>

      <Flex style={{ justifyContent: "space-between", marginTop: "2rem" }}>
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
              // navigate two screens back
              back();
              back();
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
