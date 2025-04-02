import { Text, Box } from "~components/embed/ui";
import { useCombinedBalance } from "./hooks/useCombinedBalance";

export function WalletHomeBalance() {
  const { fiatBalance, balance } = useCombinedBalance();
  return (
    <Box alignment="center" style={{ marginLeft: "20px" }}>
      <Text variant="bodySm" style={{ color: "#666666" }}>
        {"Your Balance"}
      </Text>
      <Text variant="headingXl" style={{ color: "#121212" }}>
        {Number(balance).toFixed(2)}
      </Text>
      <Text variant="bodySm" style={{ color: "#666666" }}>
        {fiatBalance}
      </Text>
    </Box>
  );
}
