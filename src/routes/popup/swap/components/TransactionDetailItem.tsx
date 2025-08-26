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
      <Text variant="secondary" size="sm" weight="medium" style={{ flexShrink: 0 }} noMargin>
        {title}
      </Text>
    ) : (
      title
    );

  const valueElement =
    typeof value === "string" ? (
      <Text
        size="sm"
        weight="medium"
        noMargin
        style={{
          color: valueColor,
          textAlign: "right",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}>
        {value}
      </Text>
    ) : (
      value
    );

  return (
    <Flex justify="space-between" gap={8} style={{ minWidth: 0 }}>
      {titleElement}
      <Flex flex={1} minWidth={0} justify="flex-end" align="center">
        {valueElement}
      </Flex>
    </Flex>
  );
}
