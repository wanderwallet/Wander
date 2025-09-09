import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { Line } from "../purchase";
import { CardContainer } from "./CardContainer";
import type { PurchaseType } from "./types";

interface RegisteringCardProps {
  name: string;
  purchaseType: PurchaseType;
  purchaseYears?: number;
  style?: React.CSSProperties;
}

export const RegisteringCard: React.FC<RegisteringCardProps> = ({ name, purchaseType, purchaseYears = 1, style }) => {
  return (
    <CardContainer style={style}>
      <Text noMargin variant="secondary" size="2xs">
        REGISTERING
      </Text>
      <Text size="lg" weight="semibold" style={{ wordBreak: "break-all", textAlign: "center" }}>
        ar://{name}
      </Text>
      <Line style={{ margin: ".25rem 0" }} />
      <Flex width="100%">
        <Text size="sm" variant="secondary" style={{ textAlign: "left", flexGrow: 1 }}>
          Registration Period
        </Text>
        <Text size="sm" weight="semibold">
          {purchaseType === "lease" ? `Lease (${purchaseYears} ${purchaseYears === 1 ? "Year" : "Years"})` : "Buy (∞)"}
        </Text>
      </Flex>
    </CardContainer>
  );
};
