import { Text, Box } from "~components/embed/ui";
import Balance from "~components/popup/home/Balance";

export function WalletHomeBalance() {
  return (
    <Box alignment="center" style={{ marginLeft: "20px", gap: "0.5rem" }}>
      <Text variant="bodySm" style={{ color: "var(--text-color-secondary)" }}>
        Your Balance
      </Text>
      <Balance />
    </Box>
  );
}
