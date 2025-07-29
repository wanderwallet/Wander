import { ButtonV2 } from "@arconnect/components";
import { Card, Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import { SuccessCheckIcon } from "~components/embed";
import { truncateMiddle } from "~utils/format";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import type { PurchaseType } from "./types";
import { LinkExternal02 } from "@untitled-ui/icons-react";

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
        <SuccessCheckIcon />
      </Flex>
      <Text size="lg" weight="semibold" style={{ margin: "0.5rem", textAlign: "center" }}>
        Name registered!
      </Text>

      <Text size="lg" style={{ wordBreak: "break-all", textAlign: "center" }}>
        ar://{name}
      </Text>
      <Text variant="secondary" style={{ textAlign: "center" }}>
        is now registered to this wallet.
      </Text>

      <RegisteringCard>
        <Text size="sm" variant="secondary" style={{ textAlign: "left", flexGrow: 1 }}>
          Registration Period
        </Text>
        <Text size="sm" weight="semibold">
          {purchaseType === "lease" ? `Lease (${purchaseYears} ${purchaseYears == 1 ? "Year" : "Years"})` : `Buy (∞)`}
        </Text>
      </RegisteringCard>
      <Flex style={{ justifyContent: "space-between" }}>
        <Text variant="secondary" size="sm">
          Transaction ID
        </Text>
        <Text size="sm" style={{ textAlign: "right" }}>
          {truncateMiddle(transactionId, 13)}
        </Text>
      </Flex>
      <a
        href={`https://www.ao.link/#/message/${transactionId}`}
        target="_blank"
        title="View transaction on ao.link"
        rel="noopener noreferrer"
        style={{ margin: "1rem 0" }}>
        <Flex gap="0.25rem">
          <Text size="sm" style={{ color: "rgba(151, 135, 255, 1)" }}>
            See transaction details
          </Text>
          <Text>
            <LinkExternal02 width=".75rem" height=".75rem" />
          </Text>
        </Flex>
      </a>
      <div style={{ flex: 1 }}></div>
      <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
        <Flex direction="column" gap="0.5rem">
          <ButtonV2 onClick={() => navigate(PopupPaths.Home)} fullWidth>
            Manage ArNS
          </ButtonV2>
          <ButtonV2 secondary onClick={() => navigate(PopupPaths.Home)} fullWidth>
            Go to dashboard
          </ButtonV2>
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
