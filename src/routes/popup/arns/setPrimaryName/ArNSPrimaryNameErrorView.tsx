import { ButtonV2 } from "@arconnect/components";
import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { WarningCircledIcon } from "~components/embed";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";

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
          Something went wrong
        </Text>

        <Text variant="secondary" style={{ margin: "0.5rem", textAlign: "center" }}>
          An error occured trying to set your ArNS primary name, please try again.
        </Text>
      </Flex>
      <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
        <Flex direction="column" gap="0.5rem">
          <ButtonV2 onClick={() => back()} fullWidth>
            Try again
          </ButtonV2>
          <ButtonV2 secondary onClick={() => navigate(PopupPaths.Home)} fullWidth>
            Go to dashboard
          </ButtonV2>
        </Flex>
      </div>
    </div>
  );
};
