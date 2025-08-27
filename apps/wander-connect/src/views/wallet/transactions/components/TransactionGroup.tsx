import { Box, Text } from "@wanderapp/ui";
import { TransactionItem } from "./TransactionItem";
import { ExtendedTransaction, getFullMonthNameWithYear } from "@wanderapp/core";

interface TransactionGroupProps {
  monthYear: string;
  transactions: ExtendedTransaction[];
}

export const TransactionGroup = ({ monthYear, transactions }: TransactionGroupProps) => {
  return (
    <Box style={{ padding: 0 }}>
      <Text alignment="left" style={{ color: "#121212" }}>
        {getFullMonthNameWithYear(monthYear)}
      </Text>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          gap: "var(--spacing-3)",
          margin: "var(--spacing-3) 0",
        }}>
        {transactions.map((transaction) => (
          <TransactionItem key={transaction.node.id} transaction={transaction} />
        ))}
      </Box>
    </Box>
  );
};
