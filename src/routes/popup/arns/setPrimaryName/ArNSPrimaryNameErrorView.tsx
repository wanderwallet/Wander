import { Button, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { WarningCircledIcon } from "~components/embed";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";

export interface ArNSPrimaryNameErrorParams {
  name: string;
}
export type ArNSPrimaryNameErrorProps = CommonRouteProps<ArNSPrimaryNameErrorParams>;

export const ArNSPrimaryNameErrorView = ({ params: { name } }: ArNSPrimaryNameErrorProps) => {
  const { navigate, back } = useLocation();

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
          <WarningCircledIcon />
        </Flex>
        <Text size="lg" weight="semibold" style={{ margin: "0.5rem", textAlign: "center" }}>
          {browser.i18n.getMessage("something_went_wrong")}
        </Text>

        <Text variant="secondary" style={{ margin: "0.5rem", textAlign: "center" }}>
          {browser.i18n.getMessage("arns_name_purchase_error")}
        </Text>
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
