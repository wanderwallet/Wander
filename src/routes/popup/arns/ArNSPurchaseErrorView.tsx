import { Button, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { RegisteringCard } from "./RegisteringCard";
import type { PurchaseType } from "./types";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";
import { ErrorIcon } from "../swap/components/ErrorIcon";

export interface ArNSPurchaseErrorParams {
  name: string;
  purchaseType: PurchaseType;
  purchaseYears?: number;
}
export type ArNSPurchaseErrorProps = CommonRouteProps<ArNSPurchaseErrorParams>;

export const ArNSPurchaseErrorView = ({ params: { name, purchaseType, purchaseYears } }: ArNSPurchaseErrorProps) => {
  const { navigate, back } = useLocation();

  useEffect(() => {
    trackPage(PageType.ARNS_PURCHASE_ERROR);
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
      <Flex direction="column" justify="center" align="stretch" style={{ flex: 1, margin: 0 }}>
        <Flex justify="center" align="center">
          <ErrorIcon />
        </Flex>
        <Text size="lg" weight="semibold" style={{ margin: "0.5rem", textAlign: "center" }}>
          {browser.i18n.getMessage("something_went_wrong")}
        </Text>

        <Text variant="secondary" style={{ margin: "0.5rem", textAlign: "center" }}>
          {browser.i18n.getMessage("arns_name_purchase_error")}
        </Text>
        <RegisteringCard name={name} purchaseType={purchaseType} purchaseYears={purchaseYears} />
      </Flex>
      <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
        <Flex direction="column" gap="0.5rem">
          <Button onClick={() => back()} fullWidth>
            {browser.i18n.getMessage("try_again")}
          </Button>
          <Button variant="secondary" onClick={() => navigate(PopupPaths.Home)} fullWidth>
            {browser.i18n.getMessage("go_to_dashboard")}
          </Button>
        </Flex>
      </div>
    </div>
  );
};
