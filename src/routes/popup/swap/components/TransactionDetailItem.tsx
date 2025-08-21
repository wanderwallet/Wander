import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";

interface TransactionDetailItemProps {
  title: React.ReactNode;
  value: React.ReactNode;
  valueColor?: string;
}

export function TransactionDetailItem({ title, value, valueColor }: TransactionDetailItemProps) {
  const titleElement =
    typeof title === "string" ? (
      <Text variant="secondary" size="sm" weight="medium" noMargin>
        {title}
      </Text>
    ) : (
      title
    );

  const valueElement =
    typeof value === "string" ? (
      <Text size="sm" weight="medium" noMargin style={{ color: valueColor }}>
        {value}
      </Text>
    ) : (
      value
    );

  return (
    <Flex justify="space-between" gap={8}>
      {titleElement}
      {valueElement}
    </Flex>
  );
}
