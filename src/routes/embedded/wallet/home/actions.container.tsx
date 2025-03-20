import {
  Row,
  CoinsIcon,
  Text,
  ReceiptIcon,
  OpenTabIcon,
  Box
} from "~components/embed/ui";
import { Link } from "~wallets/router/components/link/Link";

export function WalletHomeActions() {
  return (
    <Box alignment="left" style={{ marginLeft: "20px" }}>
      <Link
        to="/wallet/receive/options"
        style={{ textDecoration: "none", width: "100%" }}
      >
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer"
          }}
        >
          <CoinsIcon color="#121212" />
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            Receive tokens
          </Text>
        </Row>
      </Link>
      <br />
      <Link
        to="/wallet/transactions"
        style={{ textDecoration: "none", width: "100%" }}
      >
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer"
          }}
        >
          <ReceiptIcon />
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            Transaction history
          </Text>
        </Row>
      </Link>
      <br />
      <Link
        to="/wallet/settings"
        style={{ textDecoration: "none", width: "100%" }}
      >
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer"
          }}
        >
          <OpenTabIcon />
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            View wallet dashboard
          </Text>
        </Row>
      </Link>
    </Box>
  );
}
