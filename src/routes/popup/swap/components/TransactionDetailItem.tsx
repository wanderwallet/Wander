import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";

interface TransactionDetailItemProps {
  title: React.ReactNode;
  value: React.ReactNode;
}

export function TransactionDetailItem({ title, value }: TransactionDetailItemProps) {
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
      <Text size="sm" weight="medium" noMargin>
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
