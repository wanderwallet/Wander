import { Text, Box } from "~components/embed/ui";
import Balance from "~components/popup/home/Balance";

export function WalletHomeBalance() {
  return (
    <Box alignment="center" style={{ gap: "0.5rem", marginTop: "var(--spacing-6)" }}>
      <Text variant="bodySm" style={{ color: "var(--color-font-body)" }}>
        Your Balance
      </Text>
      <Balance />
    </Box>
  );
}
