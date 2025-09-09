import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { Line } from "../purchase";
import { CardContainer } from "./CardContainer";
import type { PurchaseType } from "./types";
import browser from "webextension-polyfill";

interface RegisteringCardProps {
  name: string;
  purchaseType: PurchaseType;
  purchaseYears?: number;
  style?: React.CSSProperties;
}

export const RegisteringCard: React.FC<RegisteringCardProps> = ({ name, purchaseType, purchaseYears = 1, style }) => {
  return (
    <CardContainer style={style}>
      <Text weight="medium" noMargin variant="secondary" size="xs">
        {browser.i18n.getMessage("registering")}
      </Text>
      <Text size="lg" weight="semibold" style={{ wordBreak: "break-all", textAlign: "center" }}>
        ar://{name}
      </Text>
      <Line style={{ margin: ".25rem 0" }} />
      <Flex width="100%">
        <Text size="sm" variant="secondary" style={{ textAlign: "left", flexGrow: 1 }}>
          {browser.i18n.getMessage("registration_period")}
        </Text>
        <Text size="sm" weight="semibold">
          {purchaseType === "lease"
            ? `${browser.i18n.getMessage("lease")} (${purchaseYears} ${purchaseYears === 1 ? browser.i18n.getMessage("year") : browser.i18n.getMessage("years")})`
            : `${browser.i18n.getMessage("buy")} (∞)`}
        </Text>
      </Flex>
    </CardContainer>
  );
};
