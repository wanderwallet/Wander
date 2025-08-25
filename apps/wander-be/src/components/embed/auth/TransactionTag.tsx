import type { DecodedTag } from "~api/modules/sign/tags";
import { isAddressFormat, formatAddress } from "~utils/format";
import { Row, Text } from "../ui";

export default function TransactionTag({ name, value }: DecodedTag) {
  const isAddress = isAddressFormat(value);
  return (
    <Row isFullWidth justifyContent="between">
      <Text variant="bodySm" style={{ color: "#666666" }}>
        {name}
      </Text>
      <Text variant="bodySm">{isAddress ? formatAddress(value, 6) : value}</Text>
    </Row>
  );
}
