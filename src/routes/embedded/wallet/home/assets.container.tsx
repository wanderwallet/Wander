import { Row, Text, ReceiptIcon, Box } from "~components/embed/ui";

export function WalletHomeAssets() {
  return (
    <Box alignment="left" style={{ marginLeft: "20px" }}>
      <Row
        alignment="center"
        justifyContent="start"
        style={{
          cursor: "pointer"
        }}
      >
        <ReceiptIcon />
        <Text variant="bodyMd" style={{ color: "#121212" }}>
          Assets goes here
        </Text>
      </Row>
    </Box>
  );
}
